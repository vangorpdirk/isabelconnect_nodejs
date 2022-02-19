const create_accesstoken = require('./create_accesstoken');
const bulk_payment_init_req = require('./bulk_payment_initiation_request');

//first get access token - then post payment files
create_accesstoken.create().then((d) => {
    //capture response from call for access token
    var res = {
        body: JSON.stringify(d),
    };

    //parse response to JSON and capture access_token
    var body = JSON.parse(res.body);
    console.log('ACCESS TOKEN: ', body.access_token);

    //use token to post painfiles - bulk_payment_initation
    req = bulk_payment_init_req.bulk_payment(body.access_token).then((d) => {
        //capture response from call
        var res = {
            body: JSON.stringify(d),
        };

        console.log('BULK PAYMENT RESPONSE', JSON.parse(res.body));
    });
});



