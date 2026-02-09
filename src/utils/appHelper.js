const AppInfoParser = require('app-info-parser');
const Client = require('ssh2-sftp-client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Extracts metadata from app files (apk, ipa, etc.)
 */
async function getAppMetadata(filePath, originalName) {
    const ext = path.extname(originalName || filePath).toLowerCase();
    let platform = 'unknown';
    let info = {};

    // AppInfoParser requires the file to have a valid extension
    let tempPath = filePath;
    let renamed = false;
    if ((ext === '.apk' || ext === '.ipa') && !filePath.toLowerCase().endsWith(ext)) {
        tempPath = filePath + ext;
        fs.renameSync(filePath, tempPath);
        renamed = true;
    }

    try {
        if (ext === '.apk') {
            platform = 'android';
            const parser = new AppInfoParser(tempPath);
            const result = await parser.parse();
            info = {
                versionName: result.versionName || result.version,
                versionCode: result.versionCode,
                packageName: result.package,
                label: result.application.label && result.application.label[0]
            };
        } else if (ext === '.ipa') {
            platform = 'ios';
            const parser = new AppInfoParser(tempPath);
            const result = await parser.parse();
            info = {
                versionName: result.CFBundleShortVersionString,
                versionCode: result.CFBundleVersion,
                packageName: result.CFBundleIdentifier,
                label: result.CFBundleDisplayName
            };
        } else if (ext === '.exe' || ext === '.msi') {
            platform = 'windows';
            info = { versionName: '1.0.0', versionCode: 1 }; // Placeholder for windows
        } else if (ext === '.dmg' || ext === '.pkg') {
            platform = 'macos';
            info = { versionName: '1.0.0', versionCode: 1 }; // Placeholder for macos
        }
    } finally {
        if (renamed && fs.existsSync(tempPath)) {
            fs.renameSync(tempPath, filePath);
        }
    }

    return { platform, ...info };
}

/**
 * Calculates MD5 or SHA256 of a file (for signature verification mockup)
 */
function getFileSignature(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Uploads file to SCP server
 */
async function uploadToSCP(localPath, remotePath, config) {
    const sftp = new Client();
    try {
        await sftp.connect(config);

        // Ensure directory exists
        const remoteDir = path.dirname(remotePath).replace(/\\/g, '/');
        const exists = await sftp.exists(remoteDir);
        if (!exists) {
            await sftp.mkdir(remoteDir, true);
        }

        await sftp.put(localPath, remotePath.replace(/\\/g, '/'));

        // Copy to app-last
        const lastFile = path.join(path.dirname(remotePath), `app-last${path.extname(remotePath)}`).replace(/\\/g, '/');
        await sftp.put(localPath, lastFile);

        return true;
    } catch (err) {
        console.error('SCP Upload Error:', err);
        throw err;
    } finally {
        await sftp.end();
    }
}

module.exports = {
    getAppMetadata,
    getFileSignature,
    uploadToSCP
};
