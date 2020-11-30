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
  document.querySelector('#single-email-view').style.display = 'none';
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
  document.querySelector('#single-email-view').style.display = 'none';

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
    email.className = 'btn btn-block border border-dark';
    email.id = contents.id;
    if (mailbox == 'sent') {
      // Display different data in the box
      email.innerHTML = `<b>To:</b> ${contents.recipients} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
      // Show all white backgrounds on every email
      email.className = email.className + " email-unread"
    } else {
      // we are showing the inbox or archived
      if (contents.read == true) {
        email.className = email.className + " email-read"
      } else {
        email.className = email.className + " email-unread"
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
          // Mark email as read
          read: true
      })
    });
  }

  // Fetch the email contents
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // Show the single email and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#single-email-view').style.display = 'block';

      const subject = email.subject;
      const sender = email.sender;
      const recipients = email.recipients; // This is an array
      const timestamp = email.timestamp;
      const body = email.body;

      document.querySelector('#subject').innerHTML = subject;
      document.querySelector('#sender').innerHTML = `From: ${sender}`;

      let x;
      let all_recipients = ''
      for (x of recipients) {
        if (all_recipients == '') {
          // First iteration, we dont need a comma
          all_recipients += x;
        } else {
          all_recipients += x + ', ';
        }
      }
      document.querySelector('#recipients').innerHTML = 'To: ' + all_recipients;

      document.querySelector('#timestamp').innerHTML = 'Sent on: ' + timestamp;
      document.querySelector('#body').innerHTML = body;

  });
}
