let db;

// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function(evt) {
    // save a reference to the database 
    const db = evt.target.result;
    // create an object store (table) called `budget-post`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('budget-post', { autoIncrement: true });
  };

  // upon a successful 
request.onsuccess = function(evt) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = evt.target.result;
  
    // check if app is online, if yes run uploadBudgetChanges() function to send all local db data to api
    if (navigator.onLine) {
      uploadBudgetChanges();
    }
  };
  
  request.onerror = function(evt) {
    // log error here
    console.log(evt.target.errorCode);
  };

  // This function will be executed if we attempt to submit a new budget post and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['budget-post'], 'readwrite');
  
    // access the object store for `budget-post`
    const budgetObjectStore = transaction.objectStore('budget-post');
  
    // add record to your store with add method
    budgetObjectStore.add(record);
  }

  function uploadBudgetChanges() {
    // open a transaction on your db
    const transaction = db.transaction(['budget-post'], 'readwrite');
  
    // access your object store
    const budgetObjectStore = transaction.objectStore('budget-post');
  
    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();
    getAll.onsuccess = function() {
        // if there was data in indexedDb's store, send it to the api server
        if (getAll.result.length > 0) {
          fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: 'application/json, text/plain, */*',
              'Content-Type': 'application/json'
            }
          })
            .then(response => response.json())
            .then(serverResponse => {
              if (serverResponse.message) {
                throw new Error(serverResponse);
              }
              // open one more transaction
              const transaction = db.transaction(['budget-post'], 'readwrite');
 // access the object store for `budget-post`
    const budgetObjectStore = transaction.objectStore('budget-post');
  
    // add record to your store with add method
    budgetObjectStore.clear();
    
              alert('All saved transactions has been submitted!');
            })
            .catch(err => {
              console.log(err);
            });
        }
      };
  }
  // listen for app coming back online
window.addEventListener('online', uploadBudgetChanges);