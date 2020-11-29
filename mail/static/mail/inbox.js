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
        body: body
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

      // For each email, display it in its own box
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
      // Display different data in the box
      email.innerHTML = `<b>To:</b> ${contents.recipients} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
    } else {
      // we are showing the inbox or archived
      // TODO: Make sure emails that are read (false bc of the flip) appear with a grey background (only need to do this in inbox or archived)
      if (contents.read == false) {
        // read is false because for some reason the email is generated with read as "true" no matter what, so i had to flip the meaning
        // I think this is an error with the API
        email.className = email.className + "btn-dark"
      }
      email.innerHTML = `<b>From:</b> ${contents.sender} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
    }

    // Add email to DOM
    document.querySelector('#emails-view').appendChild(email);
    email.addEventListener('click', () => view_email(email.id, mailbox));
  };

}

// Take a user to a view where they can see the contents of a clicked email
function view_email(email_id, mailbox) {
  // If we are not in the "sent" mailbox, mark the email as read (this might be an issue when we come back to the mailbox view bc we do it after making all the buttons)
  if (mailbox != 'sent') {
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          // We are marking read emails as "false" because for some reason the email is generated with read as "true" no matter what
          // I think thid may be an error with the API 
          read: false
      })
    });
  }

  // Fetch the email contents
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // ... do something else with email ...
  });
}
