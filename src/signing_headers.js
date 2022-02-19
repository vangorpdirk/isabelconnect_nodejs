const fs = require('fs');
const forge = require('node-forge');
const btoa = require('btoa');

module.exports = {
    sign_headers: function run(method, url, idem_potency_key, access_token, payload) {
        let created = Date.now() / 1000 | 0
        let keyId = "4ab1d188-b0cc-4d0b-9f62-01ce3270774f";
        let privateKeyPem = fs.readFileSync('./certs/signature_private_key.pem').toString('utf-8');
        let privateKeyPassphrase = "dynappco";
        let digestHeader = buildDigestHeader(payload);

        const headers = [
            `(request-target): ${requestTarget(method, url)}`,
            `host: api.ibanity.com`,
            `digest: ${digestHeader}`,
            `(created): ${created}`
        ]

        let signingString = headers.join('\n');

        let signedHeaders = "(request-target) host digest (created)";
        let privateKey = loadPrivateKey(privateKeyPem, privateKeyPassphrase);
        let encodedSignature = buildEncodedSignature(privateKey, signingString);
        let signatureHeader = buildSignatureHeader(keyId, 'hs2019', signedHeaders, encodedSignature, created);

        return {
            digestHeader: digestHeader,
            signatureHeader: signatureHeader
        }
    }
}

function buildDigestHeader(payload) {
    let messageDigest = forge.md.sha512.create();
    messageDigest.update(payload, "utf8");

    return "SHA-512=" + btoa(messageDigest.digest().data);
}

function buildSignatureHeader(keyId, algorithm, signedHeaders, encodedSignature, created) {
    return `keyId="${keyId}",created="${created}",algorithm="${algorithm}",headers="${signedHeaders}",signature="${encodedSignature}"`;
}

function loadPrivateKey(privateKeyPem, privateKeyPassphrase) {
    return forge.pki.decryptRsaPrivateKey(privateKeyPem, privateKeyPassphrase);
}

function requestTarget(method, url) {
    const parsedUrl = new URL(url)

    return `${method.toLowerCase()} ${parsedUrl.pathname}${parsedUrl.search}`
}

function buildEncodedSignature(privateKey, signingString) {
    const messageDigest = forge.md.sha256.create().update(signingString, "utf8")

    const pss = forge.pss.create({
        md: forge.md.sha256.create(),
        mgf: forge.mgf.mgf1.create(forge.md.sha256.create()),
        saltLength: 32
    })

    const signature = privateKey.sign(messageDigest, pss)

    return btoa(signature);
}
