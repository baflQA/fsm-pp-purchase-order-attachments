// Import ShellSDK and events list from FSMShell global variable
// see https://github.com/SAP/fsm-shell for more details.
const {ShellSdk, SHELL_EVENTS} = FSMShell;
let token, host, account, company;

// Display an error message if extension does not run within shell
if (!ShellSdk.isInsideShell()) {
    displayMessage('Unable to reach shell eventAPI');
} else {
    // Initialise ShellSDK to connect with parent shell library
    const shellSdk = ShellSdk.init(parent, '*');

    // Initialise the extension by requesting the fsm context
    shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, {
        clientIdentifier: 'service-contract',
        auth: {
            response_type: 'token'  // request a user token within the context
        }
    });
    //changed

    // Callback on fsm context response
    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_CONTEXT, (event) => {

        const {
            // extract required context from event content
            cloudHost,
            accountId,
            companyId,
            auth
        } = JSON.parse(event);

        host = cloudHost;
        account = accountId;
        company = companyId;

        // Access_token has a short life span and needs to be refreshed before expiring
        // Each extension needs to implement its own strategy to refresh it.
        token = auth.access_token;
        const tokenPromise = initializeRefreshTokenStrategy(shellSdk, auth);

        // Add a listener expecting activityID
        shellSdk.onViewState('activityID', async activityID => {
            await tokenPromise;
            window.purchaseOrderId = await fetchPurchaseOrderId(activityID);
            displayDownloadLink();
        });
    });
}

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
        'Accept': '*/*',
    };
    return headers;
}

function displayMessage(message) {
    const messageContainer = document.querySelector('#messageContainer');
    messageContainer.innerText = message;
}

function displayDownloadLink() {
    const link = document.querySelector('#purchaseOrderLink');
    link.style.display = 'block';
}

async function downloadPurchaseOrderAttachments(purchaseOrderId) {
    const file = await fetchPurchaseOrderAttachments(purchaseOrderId);
    saveAs(file, 'files.zip');
}

async function fetchPurchaseOrderId(activityId) {
    // const response = (await fetch(
    //     //https://et.dev.coresuite.com/api/query/v1?&account=scribe&company=Ambit%20AG&dtos=BusinessPartner.17;ServiceCall.17
    //     `https://${host}/api/query/v1/?dtos=Attachment.16`,
    //     {
    //         method: 'POST',
    //         body: {query: `SELECT po.id, a.id FROM PurchaseOrder po LEFT JOIN Attachment a on a.object = po.id WHERE po.object = '${activityId}'`},
    //         headers: getHeaders(account, company),
    //     },
    // )).json();

    const response = (await fetch(
        `https://${host}/api/query/v1/?dtos=Attachment.16`,
        {
            method: 'POST',
            body: JSON.stringify({query: `SELECT po.id, a.id FROM PurchaseOrder po LEFT JOIN Attachment a on a.object = po.id WHERE po.object = '${activityId}'`}),
            headers: getHeaders(account, company),
        },
    )).json();

    console.log(response);
    return response.results[0].purchaseOrder.id;
}

function fetchPurchaseOrderAttachments(purchaseOrderId) {
    return fetch(
        `https://${host}/cloud-partner-dispatch-service/api/v2/assignment-details/purchase-order/${purchaseOrderId}/attachments`,
        {
            headers: getHeaders(account, company),
        },
    )
        .then(response => response.blob());
}
