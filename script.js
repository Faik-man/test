function insertAfter(elem, refElem)
{
	return refElem.parentNode.insertBefore(elem, refElem.nextSibling);
}

function supports_html5_storage()
{
	return window.localStorage != null && window['localStorage'] != null;
}

class Model {
    #arrayOfSelectedAnswers;
    #indexTest;

    constructor() {
        this.#arrayOfSelectedAnswers = loadAnswersFromStorage();
        this.#indexTest = loadIndexTestFromStorage();

        this.testArray = test_array;
    }

    bindModelDataChanged(callback) {
        this.onDataChanged = callback;
    }

    getQuestion() {
        return (this.#indexTest === -1
            ? ''
            : (this.#indexTest + 1) + ') ' + this.testArray[this.#indexTest].question);
    }

    getNumQuestions() {
        return this.testArray.length;
    }

    getOptions() {
        return (this.#indexTest === -1
            ? []
            : this.testArray[this.#indexTest].options);
    }

    getAnswers() {
        return this.testArray[this.#indexTest].answer_index;
    }

    prevQuestion() {
        --this.#indexTest;

        if (this.#indexTest < 0) {
            this.#indexTest = 0;
            return;
        }

        saveIndexTestToStorage(this.#indexTest);
        this.onDataChanged();
    }

    gotoQuestion(num) {
        console.assert(num > 0 && num < this.getNumQuestions());
        this.#indexTest = num;

        saveIndexTestToStorage(this.#indexTest);
        this.onDataChanged();
    }

    nextQuestion() {
        ++this.#indexTest;

        const numQuestions = this.getNumQuestions();
        if (this.#indexTest === numQuestions) {
            this.#indexTest = numQuestions - 1;
            alert("Это был последний вопрос.");
        }

        saveIndexTestToStorage(this.#indexTest);
        this.onDataChanged();
    }

    saveAnswer(str) {
        console.assert(typeof str === 'string');

        this.#arrayOfSelectedAnswers[this.#indexTest] = str;
        saveAnswersToStorage(this.#arrayOfSelectedAnswers);
    }

    getModelData() {
        return {
            question: this.getQuestion(),
            options: this.getOptions(),
            arrayOfSelectedAnswers: this.#arrayOfSelectedAnswers,
            indexTest: this.#indexTest,
            numQuestions: this.getNumQuestions()
        };
    }

    clearStorage() {
        window.localStorage.clear();
    }
}

class View {
    constructor()
    {
        this.outputText = document.getElementsByTagName('textarea')[0];

        this.form = document.createElement('form');

        this.startButton = document.querySelector('#start');
        this.gotoButton = document.querySelector('#goto');
        this.clearButton = document.querySelector('#clear');

        this.backward = document.createElement('button');
        this.backward.setAttribute('id', 'back');
        this.backward.innerHTML = 'Назад';

        this.forward = document.createElement('button');
        this.forward.setAttribute('id', 'forward');
        this.forward.innerHTML = 'Продолжить';

        this.buttons = document.querySelector('#buttons');

        this.handleAnswer = null;
    }

    bindClearStorage(handler) {
        this.clearButton.addEventListener('click', () => {
            handler();
        });
    }

    bindPrevQuestion(handler)
    {
        this.backward.addEventListener('click', () => {
            handler();
        });
    }

    bindNextQuestion(handler)
    {
        this.forward.addEventListener('click', () => {
            handler();
        });
    }

    bindStartTest(handler)
    {
        this.startButton.addEventListener('click', () => {
            handler();
        });
    }

    bindGotoQuestion(handler)
    {
        this.gotoButton.addEventListener('click', () => {
            handler();
        });
    }

    bindAnswerTest(handler) {
        this.handleAnswer = handler;
    }

    getSelectedAnswers() {
        let newForm = document.getElementsByTagName('form')[0];
        let options = newForm.elements;

        let inputs_with_index = Array.prototype.map.call(options, (input, index) => {
            return {'input': input, 'index': index};
        });

        let selectedInputs = Array.prototype.filter.call(inputs_with_index, input => {
            return input['input'].checked;
        });

        console.assert(selectedInputs.length == 1);

        let tempArray = Array.prototype.map.call(selectedInputs, input => {
            return input['index'] + 1;
        });

        console.assert(Array.isArray(tempArray));
        return tempArray;
    }

    displayMessage(selectedAnswers, answers) {
        if (selectedAnswers.length === answers.length && selectedAnswers.toString() === answers.toString()) {
            this.outputText.value = "Ответ правильный";
        } else {
            this.outputText.value = "Ответ неправильный. " + "Правильный ответ: " + answers.toString();
        }
    }

    render(modelData) {
        let {question, options, arrayOfSelectedAnswers, indexTest, numQuestions} = modelData;

        if (indexTest !== -1)
        {
            this.buttons.append(this.backward, this.forward);
            this.startButton.style.display = 'none';

            let testElement = document.getElementById('test');
            let wrapper = document.getElementById('wrapper');

            removeTextNodes(wrapper);
            removeTextNodes(testElement);

            {
                let el = document.getElementById('num_all_questions');
                el.innerHTML = '/' + numQuestions.toString();
            }

            this.outputText.value = '';

            this.form.remove();

            let questionNode = document.createElement('p');
            questionNode.innerHTML = question;

            this.form = document.createElement('form');
            this.form.appendChild(questionNode);

            {
                let k = arrayOfSelectedAnswers[indexTest];

                let new_inputs = Array.prototype.map.call(options, (input) => {
                    let label = document.createElement('label');
                    label.innerHTML = input;

                    let newInput = document.createElement('input');
                    newInput.setAttribute('type', 'radio');
                    newInput.setAttribute('id', 'answer');
                    newInput.addEventListener('click', this.handleAnswer);
                    newInput.setAttribute('name', 'input');

                    this.form.append(newInput, label, document.createElement('br'));

                    return newInput;
                });

                //console.log(indexOfAnswerInTest);
                //console.log(k);

                if (k != undefined && typeof k == "string")
                {
                    let answers = k.split(",");

                    Array.prototype.forEach.call(answers, (answer) => {
                        new_inputs[+answer - 1].checked = "true";
                    });
                }
            }

            insertAfter(this.form, document.body.firstElementChild.firstElementChild);
        }
    }
}

class Controller {
    #model;
    #view;

    constructor(model, view)
    {
        this.#model = model;
        this.#view = view;

        this.#view.bindPrevQuestion(this.prevQuestion);
        this.#view.bindNextQuestion(this.nextQuestion)
        this.#view.bindStartTest(this.startTest);
        this.#view.bindGotoQuestion(this.gotoQuestion);
        this.#view.bindClearStorage(this.clearStorage);

        this.#view.bindAnswerTest(this.answer);

        this.#model.bindModelDataChanged(this.onDataChanged);

        this.onDataChanged(this.#model.getModelData());
    }

    onDataChanged = () => {
        this.#view.render(this.#model.getModelData());
    }

    nextQuestion = () => {
        this.#model.nextQuestion();
    }

    prevQuestion = () => {
        this.#model.prevQuestion();
    }

    startTest = () => {
        this.#model.nextQuestion();
    }

    gotoQuestion = () => {
        let questionNumber = Number(document.getElementById('number_question').value);

        if (questionNumber < 1) {
            alert("Введите положительное число от 1 до " + this.#model.getNumQuestions() + "!");
            return;
        }

        this.#model.gotoQuestion(questionNumber - 1);
    }

    clearStorage = () => {
        this.#model.clearStorage();
    }

    answer = () => {
        let selectedAnswers = this.#view.getSelectedAnswers();
        this.#model.saveAnswer(selectedAnswers.toString());

        let answers = this.#model.getAnswers();
        this.#view.displayMessage(selectedAnswers, answers);
    }
}

const app = new Controller(new Model(), new View());

function removeTextNodes(node)
{
    for (var i = node.childNodes.length - 1; i >= 0; --i)
    {
        var childNode = node.childNodes[i];
        if (childNode.nodeType == Node.TEXT_NODE && !(/[a-z]|[0-9]/i.test(childNode.textContent)))
        {
            node.removeChild(childNode);
        }
    }
}

function loadAnswersFromStorage()
{
    if (localStorage.getItem('answer') !== null) {
		let arrayOfSelectedAnswers = JSON.parse(localStorage.getItem('answer'));
	    return arrayOfSelectedAnswers;
	}

	return [];
}

function loadIndexTestFromStorage()
{
    if (localStorage.getItem('indexOfAnswerInTest'))
    {
        return Number(localStorage.getItem('indexOfAnswerInTest'));
    }

    return -1;
}

function saveAnswersToStorage(arrayOfSelectedAnswers)
{
    localStorage.setItem('answer', JSON.stringify(arrayOfSelectedAnswers));
}

function saveIndexTestToStorage(indexOfAnswerInTest)
{
    localStorage.setItem('indexOfAnswerInTest', indexOfAnswerInTest);
}

