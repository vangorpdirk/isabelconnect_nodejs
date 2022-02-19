const https = require('https');
const fs = require('fs');
const sign_header = require('./signing_headers');

module.exports = {
    bulk_payment: function httprequest(access_token, idem_potency_key) {
        return new Promise(((resolve, reject) => {
            // var payload = fs.readFileSync('./files/MRI_ING_BE6500003281.xml').toString('utf-8');
            var payload = 'hello world';

            //idem_potency
            var idem_potency_key = randomUUIDGenerator();

            //signingheaders: digest + signature
            const sign_headers = sign_header.sign_headers("post", "https://api.ibanity.com/isabel-connect/bulk-payment-initiation-requests", idem_potency_key, access_token, payload);

            const options = {
                hostname: 'api.ibanity.com',
                method: 'POST',
                path: '/isabel-connect/bulk-payment-initiation-requests',
                key: fs.readFileSync('./certs/private_key.pem'),
                cert: fs.readFileSync('./certs/certificate.pem'),
                passphrase: 'dynappco',
                headers: {
                    'Authorization': 'Bearer ' + access_token,
                    'Content-Type': 'application/xml',
                    'Accept': 'application/vnd.api+json',
                    'Content-Length': Buffer.byteLength(payload),
                    // 'Ibanity-Idempotency-Key': idem_potency_key,
                    'Content-Disposition': 'inline; filename=\'payments.xml\'',
                    'Digest': sign_headers.digestHeader,
                    'Signature': sign_headers.signatureHeader
                }
            };

            //setup the request
            const req = https.request(options, (res) => {
                // console.log('statusCode:', res.statusCode);
                // console.log('headers:', res.headers);

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    console.error('statuscode: ', res.statusCode);
                }

                var body = [];
                res.on('data', (d) => {
                    body.push(d);
                });

                res.on('end', function () {
                    try {
                        body = JSON.parse(Buffer.concat(body).toString());
                    } catch (e) {
                        reject(e);
                    }
                    resolve(body);
                });
            }).on('error', (e) => {
                console.error(e);
            });

            //post the data
            req.write(payload);
            req.end()
        }));
    }
}

function randomUUIDGenerator() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
