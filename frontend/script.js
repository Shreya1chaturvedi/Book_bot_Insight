document.addEventListener('DOMContentLoaded', () => {
    const loginPage = document.getElementById('loginPage');
    const dashboard = document.getElementById('dashboard');
    const signInBtn = document.querySelector('.sign-in-btn');
    const questionInput = document.querySelector('.question-input');
    const questionsContainer = document.querySelector('.questions');
    const answersContainer = document.querySelector('.answers');
    const fileUpload = document.getElementById('fileUpload');
    const uploadedFiles = document.getElementById('uploadedFiles');

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

    // Add question to backend and display
    const handleQuestion = async (question) => {
        try {
            const response = await fetch('http://localhost:5000/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question }),
            });

            if (!response.ok) throw new Error('Failed to add question');

            const data = await response.json();
            const questionElement = document.createElement('p');
            questionElement.textContent = data.question;
            questionsContainer.appendChild(questionElement);

            const answerElement = document.createElement('p');
            answerElement.textContent = 'Pending answer';
            answersContainer.appendChild(answerElement);
        } catch (error) {
            console.error('Error adding question:', error);
        }
    };

    // Handle Enter key press
    questionInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && questionInput.value.trim() !== '') {
            handleQuestion(questionInput.value.trim());
            questionInput.value = ''; // Clear the input field after submitting
        }
    });

    // Handle Share button click
    const shareBtn = document.querySelector('.share-btn');
    shareBtn.addEventListener('click', () => {
        if (questionInput.value.trim() !== '') {
            handleQuestion(questionInput.value.trim());
            questionInput.value = ''; // Clear the input field after submitting
        }
    });

    // File upload functionality
    fileUpload.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;

        const formData = new FormData();
        formData.append('pdf', files[0]);

        try {
            const questionId = prompt('Enter the question ID to associate with this file:');
            if (!questionId) {
                alert('Question ID is required to upload the file.');
                return;
            }

            const response = await fetch(`http://localhost:5000/questions/${questionId}/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to upload file');

            const data = await response.json();
            const fileElement = document.createElement('p');
            fileElement.innerHTML = `Uploaded: <a href="http://localhost:5000${data.pdfPath}" target="_blank">${data.filename}</a>`;
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

    // Initial fetch
    fetchQuestions();
});
