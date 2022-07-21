//variable for database connection
let db;
//connection to Idb database
const request = indexedDB.open("budget_tracker, 1")

request.onupgradeneeded = function(event) {
    const db = event.target.result
    db.createObjectStore("new_budget_item", {autoIncrement: true});
}

request.onsuccess = function(event) {
    db = event.target.result
    if(navigator.onLine) {
        uploadBudgetItem()
    }
};

request.onerror = function(event) {
    console.log(event.target.errorCode)
}

function saveRecord(record) {
    //open new transaction
    const transaction = db.transaction(["new_budget_item"], "readwrite");

    ///access object store
    const budgetObjectStore = transaction.objectStore("new_budget_item");

    budgetObjectStore.add(record)
}

function uploadBudgetItem() {
    //open new transaction
    const transaction = db.transaction(["new_budget_item"], "readwrite")

    ///access object store
    const budgetObjectStore = transaction.objectStore("new_budget_item");

    //get all records from store
    const getAll = budgetObjectStore.getAll();

    getAll.onsuccess = function() {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-type": "application/json"
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }
                //open another transaction to clear store
                const transaction = db.transaction(["new_budget_item"], "readwrite");
                //access object store
                const budgetObjectStore = transaction.objectStore("new_budget_item");
                //clear all items
                budgetObjectStore.clear();

                alert("All saved budget items have been submitted")
            })
            .catch(err => {
                console.log(err);
            })
        }
    }
}

window.addEventListener("online", uploadBudgetItem);