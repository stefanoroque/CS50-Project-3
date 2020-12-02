// Wait for the DOM to be completely loaded before adding event listeners
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());
  document.querySelector('#compose-form').onsubmit = send_email;  

  // By default, load the inbox
  load_mailbox('inbox');
});

// Function to compose an email
function compose_email(recip = null, subj = null, time_stmp = null, bdy = null) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  if (recip == null) {
    // completely new email, we do not want to prefill the form
    // Clear out composition fields
    document.querySelector('#compose-recipients').value = '';
    document.querySelector('#compose-subject').value = '';
    document.querySelector('#compose-body').value = '';
    
  } else {
    // We are responding to an email
    // Pre-fill composition fields
    document.querySelector('#compose-recipients').value = recip;
    if (subj.slice(0,4) == 'Re: ') {
      // Don't need to add prefix again
      document.querySelector('#compose-subject').value = subj;
    } else {
      document.querySelector('#compose-subject').value = `Re: ${subj}`;
    }
    document.querySelector('#compose-body').value = `On ${time_stmp}, ${recip} wrote: "${bdy}"\n\n`;
  }

  // Clear out warning message
  document.querySelector('#compose-msg').innerHTML = '';
  
}

// Function to send an email using the API
function send_email() {

  // Get values from the form
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

// Function to load the mailbox view
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

      // For each email, display it in its own button
      for (i in emails) {
        add_email(emails[i], mailbox)
      }
  });

  // Add a new email with given contents to DOM
  function add_email(contents, mailbox) {

    const email = document.createElement('button');
    email.className = 'btn btn-block border border-dark';
    email.id = contents.id;

    if (mailbox == 'sent') {
      // Display different information in the button
      email.innerHTML = `<b>To:</b> ${contents.recipients} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
      // Show all white backgrounds on every email
      email.className = email.className + " email-unread"
    } else if (mailbox == 'inbox') {
      // we are showing the inbox 
      if (contents.archived == true) {
        // Email has been archived, do not display
        return;
      }
      if (contents.read == true) {
        email.className = email.className + " email-read"
      } else {
        email.className = email.className + " email-unread"
      }
      email.innerHTML = `<b>From:</b> ${contents.sender} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
    } else {
      // We are showing archived
      if (contents.archived == false) {
        // Email has not been archived, do not display
        return;
      }
      if (contents.read == true) {
        email.className = email.className + " email-read"
      } else {
        email.className = email.className + " email-unread"
      }
      email.innerHTML = `<b>From:</b> ${contents.sender} | <b>Subject:</b> ${contents.subject} | <b>Sent on:</b> ${contents.timestamp}`;
    }

    // Add email button to DOM
    document.querySelector('#emails-view').appendChild(email);
    email.addEventListener('click', () => view_email(email.id, mailbox));
  };

}

// Take a user to a view where they can see the contents of a clicked email
function view_email(email_id, mailbox) {
  // If we are not in the "sent" mailbox, mark the email as read
  if (mailbox != 'sent') {
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          // Mark email as read
          read: true
      })
    })
    .catch(error => {
      console.log('Error:', error)
    });
  }

  // Fetch the email contents
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // Show the single email view and hide other views
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#single-email-view').style.display = 'block';

      const subject = email.subject;
      const sender = email.sender;
      const recipients = email.recipients; // This is an array
      const timestamp = email.timestamp;
      const body = email.body;

      // Populate the DOM
      document.querySelector('#subject').innerHTML = subject;
      document.querySelector('#sender').innerHTML = `From: ${sender}`;

      let x;
      let all_recipients = '';
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

      // Remove any reply button that was previously placed in DOM
      if (document.getElementById('reply-btn') != null) {
        document.getElementById('reply-btn').remove();
      }

      const reply_btn = document.createElement('button');
      reply_btn.className = 'btn btn-primary';
      reply_btn.id = 'reply-btn'
      reply_btn.innerHTML = 'Reply';

      // Add reply button to DOM
      document.querySelector('#single-email-view').appendChild(reply_btn);
      reply_btn.addEventListener('click', () => reply_email(email.id));

      // Remove any archive button that was previously placed in DOM
      if (document.getElementById('archive-btn') != null) {
        document.getElementById('archive-btn').remove();
      }

      // Add buttons to archive or unarchive an email
      if (mailbox == 'inbox') {
        // We are in the inbox, so we would want the option to archive
        const archive_btn = document.createElement('button');
        archive_btn.className = 'btn btn-secondary';
        archive_btn.id = 'archive-btn'
        archive_btn.innerHTML = 'Archive Email';

        // Add button to DOM
        document.querySelector('#single-email-view').appendChild(archive_btn);
        archive_btn.addEventListener('click', () => archive_unarchive(email.id, mailbox));


      } else if (mailbox == 'archive') {
        // We are in the archived mailbox, so we would want the option to unarchive
        const archive_btn = document.createElement('button');
        archive_btn.className = 'btn btn-secondary';
        archive_btn.id = 'archive-btn'
        archive_btn.innerHTML = 'Unarchive Email';

        // Add email to DOM
        document.querySelector('#single-email-view').appendChild(archive_btn);
        archive_btn.addEventListener('click', () => archive_unarchive(email.id, mailbox));

      }

  })
  .catch(error => {
    console.log('Error:', error)
  });
}


// User replies to an email, brings them to a pre-filled compose form
function reply_email (email_id) {
  // Fetch the email contents
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      // Take user to pre-filled composition form
      compose_email(email.sender, email.subject, email.timestamp, email.body);

  })
  .catch(error => {
    console.log('Error:', error)
  });

}


// User archives or unarchives an email
function archive_unarchive (email_id, mailbox) {
  let arch;

  if (mailbox == 'inbox') {
    // We want to archive the email
    arch = true;
  } else {
    // We are in the archived mailbox, so we want to unarchive
    arch = false;
  }

  // Send request to API
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: arch
    })
  })
  .catch(error => {
    console.log('Error:', error)
  });

  // Bring user back to their inbox
  load_mailbox('inbox');

  // Need to reload page so that the mailbox properly updates and has the correct emails in it (Kind of a work around)
  // I think the browser was cacheing old information
  location.reload();
}
