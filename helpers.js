function initializeRefreshTokenStrategy(shellSdk, auth) {

    shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {
        sessionStorage.setItem('token', event.access_token);
        setTimeout(() => fetchToken(), (event.expires_in * 1000) - 5000);
    });

    function fetchToken() {
        shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
            response_type: 'token'  // request a user token within the context
        });
    }

    sessionStorage.setItem('token', auth.access_token);
    setTimeout(() => fetchToken(), (auth.expires_in * 1000) - 5000);
}

function getHeaders() {
    const headers = {
        'Content-Type': 'application/json',
        'X-Client-ID': 'fsm-udf-plugin-sample',
        'X-Client-Version': '1.0.0',
        'Authorization': `bearer ${sessionStorage.getItem('token')}`,
    };
    return headers;
}

function firstCharToLowerCase(str) {
    return str.charAt(0).toLowerCase() + str.substring(1);
}

function displayMessage(message) {
    const messageContainer = document.querySelector('#messageContainer');
    messageContainer.innerText = message;

}

function displayUDFs(udfs) {
    const container = document.querySelector('#container');
    container.innerHTML = '';

    udfs.forEach(udf => {
        const header = document.createElement('h1');
        header.innerText = udf.name;
        header.className = 'header';
        container.appendChild(header);
        const value = document.createElement('span');
        value.innerText = udf.value;
        container.appendChild(value);
    });
}

async function fetchDataObjectById(dtoName, dtoVersion, cloudHost, account, company, objectId) {
    const response = await fetch(
        `https://${cloudHost}/api/data/v4/${dtoName}/${objectId}?dtos=${dtoName}.${dtoVersion}&account=${account}&company=${company}`,
        {headers: getHeaders()},
    );
    const responseBody = await response.json();
    return responseBody.data[0][firstCharToLowerCase(dtoName)];
}

async function getUDFs(cloudHost, account, company, activityID) {
    const serviceCall = await fetchDataObjectById('Activity', '39', cloudHost, account, company, activityID);

    return Promise.all(
        serviceCall.udfValues
            ? serviceCall.udfValues.map(udfValue => getUdfNameValuePairs(cloudHost, account, company, udfValue))
            : []
    );
}

async function getUdfNameValuePairs(cloudHost, account, company, udfValue) {
    const udfMeta = await fetchDataObjectById('UdfMeta', '19', cloudHost, account, company, udfValue.meta);
    return {
        name: udfMeta.description || udfMeta.name,
        value: udfValue.value,
    };
}
