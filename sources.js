// Import ShellSDK and events list from FSMShell global variable
// see https://github.com/SAP/fsm-shell for more details.
const {ShellSdk, SHELL_EVENTS} = FSMShell;
let token;
let credentials;

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
            account,
            company,
            auth
        } = JSON.parse(event);

        credentials = {
            cloudHost,
            account,
            company,
        }

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

async function fetchDataObjectById(dtoName, dtoVersion, objectId) {
    const response = await fetch(
        `https://${credentials.cloudHost}/api/data/v4/${dtoName}/${objectId}?dtos=${dtoName}.${dtoVersion}&account=${credentials.account}&company=${credentials.company}`,
        {headers: getHeaders()},
    );
    const responseBody = await response.json();
    return responseBody.data[0][firstCharToLowerCase(dtoName)];
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


function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-pp-purchase-order-attachments',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${token}`,
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
    const activity = await fetchDataObjectById('Activity', 36, activityId);
    const purchaseOrder = await fetchDataObjectById('PurchaseOrder', 14, activity.remarks);

    console.log(purchaseOrder)
    return null;
}

function fetchPurchaseOrderAttachments(purchaseOrderId) {
    return fetch(
        //GET https://www.baseUrl.com/data/api/v4/Attachment/{attachmentId}/content
        `https://${credentials.cloudHost}/data/api/v4/Attachment/${objectId}?dtos=${dtoName}.${dtoVersion}&account=${credentials.account}&company=${credentials.company}`,
        {headers: getHeaders()},
    )
    .then(response => response.blob());
}
