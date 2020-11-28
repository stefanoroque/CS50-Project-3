document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').onsubmit = send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
  // Clear out warning message
  document.querySelector('#compose-msg').innerHTML = '';
}

function send_email() {

  // Get values
  let recipient = document.querySelector('#compose-recipients').value;
  let subject = document.querySelector('#compose-subject').value;
  let body = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipient,
        subject: subject,
        body: body,
    })
  })
  // Put response into json form
  .then(response => response.json())
  .then(result => {
    if (result.message == undefined) {
      // Email was not successfully sent
      console.log(result);
      document.querySelector('#compose-msg').innerHTML = `Oops! Something isn't right here: ${result.error}`;
    } else {
      // Email successfully sent
      console.log(result)
      // TODO: make sure this email is added to the list of sent emails
      // Bring the user to their sent mailbox
      load_mailbox('sent');
    }
  })
  .catch(error => {
    console.log('Error:', error)
  });
    
  // Stop form from submitting
  return false;
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Update mailbox with the latest emails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      // For each email, display it in its own div
      for (i in emails) {
        add_email(emails[i], mailbox)
      }
  });

  // Add a new email with given contents to DOM
  function add_email(contents, mailbox) {
    console.log(mailbox);
    const email = document.createElement('button');
    email.className = 'btn btn-block email border border-dark';
    email.id = contents.id;
    if (mailbox == 'sent') {
      // Display different data in the div
      email.innerHTML = `<b>To:</b> ${contents.recipients} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
      email.recipients = contents.recipients;
      email.subject = contents.subject;
      email.timestamp = contents.timestamp;
    } else {
      // we are showing the inbox or archived
      email.innerHTML = `<b>From:</b> ${contents.sender} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
      email.sender = contents.sender;
      email.subject = contents.subject;
      email.timestamp = contents.timestamp;
    }


    

    // Add email to DOM
    document.querySelector('#emails-view').appendChild(email);
    email.addEventListener('click', () => console.log(email.id));
  };

  

}