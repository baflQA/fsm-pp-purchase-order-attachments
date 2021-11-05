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

async function fetchServiceAssignment(cloudHost, account, company, activityId) {
    const response = await fetch(
        `https://${cloudHost}/cloud-partner-dispatch-service/v1/assignment-details?Activity=${activityId}`,
        {
            headers: getHeaders(account, company),
            mode: 'no-cors',
        },
    );
    return await response.json();
}

async function fetchPurchaseOrderAttachments(cloudHost, account, company, purchaseOrderId) {
    const response = await fetch(
        `https://${cloudHost}/cloud-partner-dispatch-service/v2/assignment-details/purchase-order/${purchaseOrderId}/attachments`,
        {
            headers: getHeaders(account, company),
            mode: 'no-cors',
        },
    );
    return await response.json();
}

async function getPurchaseOrderAttachments(cloudHost, account, company, activityID) {
    const serviceAssignment = await fetchServiceAssignment(cloudHost, account, company, activityID);
    console.log(serviceAssignment);
// const purchaseOrderAttachments = await fetchPurchaseOrderAttachments(cloudHost, account, company, serviceAssignment.purchaseOrder);
    return 'not implemented yet';
}

