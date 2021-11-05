let token;

function initializeRefreshTokenStrategy(shellSdk, auth) {
    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {
        token = event.access_token;
        setTimeout(() => fetchToken(), (event.expires_in * 1000) - 5000);
    });

    function fetchToken() {
        shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
            response_type: 'token'  // request a user token within the context
        });
    }

    setTimeout(() => fetchToken(), (auth.expires_in * 1000) - 5000);
}


function getHeaders(account, company) {
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-pp-purchase-order-attachments',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${token}`,
        'X-Account-ID': account,
        'X-Company-ID': company,
    };
    return headers;
}

function displayMessage(message) {
    const messageContainer = document.querySelector('#messageContainer');
    messageContainer.innerText = message;
}

function displayDownloadLink(message) {
    const link = document.querySelector('#purchaseOrderLink');
    link.style.display = 'block';
}

function downloadPurchaseOrderAttachments(purchaseOrderId) {
    console.log('download purch order att', purchaseOrderId);
}

async function fetchPurchaseOrderId(cloudHost, account, company, activityId) {
    // const response = (await fetch(
    //     `https://${cloudHost}/cloud-partner-dispatch-service/v2/assignment-details?size=1&page=0&id=${activityId}`,
    //     {
    //         headers: getHeaders(account, company),
    //         mode: 'no-cors',
    //     },
    // )).json();
    // return response.results[0].purchaseOrder.id;
    return Promise.resolve('6CA76F9FB1B1150B42E5E85D218F1AEA');
}

async function fetchPurchaseOrderAttachments(cloudHost, account, company, purchaseOrderId) {
    return await fetch(
        `https://${cloudHost}/cloud-partner-dispatch-service/v2/assignment-details/purchase-order/${purchaseOrderId}/attachments`,
        {
            headers: getHeaders(account, company),
            mode: 'no-cors',
        },
    ).json();
}

async function getPurchaseOrderId(cloudHost, account, company, activityID) {
    return await fetchPurchaseOrderId(cloudHost, account, company, activityID);
}

