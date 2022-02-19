var querystring = require('querystring')
const https = require('https')
const fs = require('fs');
const sign_header = require('./signing_headers');

module.exports = {
    create: function httprequest(idem_potency_key) {
        return new Promise(((resolve, reject) => {
            var idem_potency_key = randomUUIDGenerator();

            const post_data = querystring.stringify({
                'grant_type': 'refresh_token',
                'refresh_token': 'valid_refresh_token',
                'client_id': 'valid_client_id',
                'client_secret': 'valid_client_secret'
            });

            //signingheaders: digest + signature
            const sign_headers = sign_header.sign_headers("POST", "https://api.ibanity.com/isabel-connect/oauth2/token", idem_potency_key);

            const options = {
                hostname: 'api.ibanity.com',
                method: 'POST',
                path: '/isabel-connect/oauth2/token',
                key: fs.readFileSync('./certs/private_key.pem'),
                cert: fs.readFileSync('./certs/certificate.pem'),
                passphrase: 'dynappco',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/vnd.api+json',
                    'Content-Length': Buffer.byteLength(post_data),
                    'Ibanity-Idempotency-Key': idem_potency_key,
                    'Digest': sign_headers.digestHeader,
                    'Signature': sign_headers.signatureHeader
                }
            };

            //setup the request
            const req = https.request(options, (res) => {
                // console.log('statusCode:', res.statusCode);
                // console.log('headers:', res.headers);

                if (res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error('statusCode=' + res.statusCode));
                }
                var body = [];
                res.on('data', (d) => {
                    // body.push(new TextDecoder().decode(d));
                    // process.stdout.write(d);
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
            req.write(post_data);
            req.end();
        }));
    }
}

function randomUUIDGenerator() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


