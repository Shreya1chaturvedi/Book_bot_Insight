document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('loginPage');
    const dashboard = document.getElementById('dashboard');
    const signInBtn = document.querySelector('.sign-in-btn');
    const questionInput = document.querySelector('.question-input');
    const questionsContainer = document.querySelector('.questions');
    const answersContainer = document.querySelector('.answers');
    const uploadButton = document.getElementById('uploadButton');
    const fileInput = document.getElementById('fileInput');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const shareBtn = document.querySelector('.share-btn');
    const helpBtn = document.querySelector('.header-btn:nth-child(2)'); // Selects "Help" button

    // Navigate to Help page
    helpBtn.addEventListener('click', () => {
        window.location.href = 'help.html';
    });

    // Sign-in functionality
    signInBtn.addEventListener('click', () => {
        const email = document.querySelector('input[type="email"]').value;
        const password = document.querySelector('input[type="password"]').value;

        if (email && password) {
            loginPage.style.display = 'none';
            dashboard.style.display = 'block';
        } else {
            alert('Please enter valid email and password.');
        }
    });

    // Logout functionality
    const logoutBtn = document.querySelector('.header-btn:nth-child(3)');
    logoutBtn.addEventListener('click', () => {
        dashboard.style.display = 'none';
        loginPage.style.display = 'flex';
    });

    // Handle Share button click
    shareBtn.addEventListener('click', async () => {
        const questionText = questionInput.value.trim();

        if (questionText !== '') {
            const questionElement = document.createElement('p');
            questionElement.textContent = questionText;
            questionsContainer.appendChild(questionElement);

            try {
                const response = await fetch('http://localhost:5000/questions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: questionText }),
                });
                if (!response.ok) throw new Error('Failed to add question');
            } catch (error) {
                console.error('Error adding question:', error);
            }

            questionInput.value = '';
        } else {
            alert('Please enter a question to share.');
        }
    });

    // Trigger file input when Upload PDF button is clicked
    uploadButton.addEventListener('click', () => {
        fileInput.click();
    });

    // File upload functionality
    fileInput.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;

        const formData = new FormData();
        formData.append('pdf', files[0]);

        try {
            const response = await fetch('http://localhost:5000/questions');
            if (!response.ok) throw new Error('Failed to fetch questions');

            const data = await response.json();
            if (data.length === 0) {
                alert('No questions available to associate the file.');
                return;
            }

            const latestQuestionId = data[data.length - 1].id;
            const uploadResponse = await fetch(`http://localhost:5000/questions/${latestQuestionId}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Failed to upload file');

            const uploadData = await uploadResponse.json();
            const fileElement = document.createElement('p');
            fileElement.innerHTML = `Uploaded: <a href="http://localhost:5000${uploadData.pdfPath}" target="_blank">${uploadData.filename}</a>`;
            uploadedFiles.appendChild(fileElement);
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    });

    // Fetch and display all questions
    const fetchQuestions = async () => {
        try {
            const response = await fetch('http://localhost:5000/questions');
            if (!response.ok) throw new Error('Failed to fetch questions');

            const data = await response.json();
            questionsContainer.innerHTML = '';
            answersContainer.innerHTML = '';

            data.forEach((item) => {
                const questionElement = document.createElement('p');
                questionElement.textContent = item.question;
                questionsContainer.appendChild(questionElement);

                const answerElement = document.createElement('p');
                answerElement.textContent = item.answer || 'Pending answer';
                answersContainer.appendChild(answerElement);
            });
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    fetchQuestions();
});
