function insertAfter(elem, refElem)
{
	return refElem.parentNode.insertBefore(elem, refElem.nextSibling);
}

function supports_html5_storage()
{
	return window.localStorage != null && window['localStorage'] != null;
}

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
    if (localStorage.getItem('answer')) {
		let arrayOfSelectedAnswers = JSON.parse(localStorage.getItem('answer'));
	    return arrayOfSelectedAnswers;
	}

	return [];
}

function saveAnswersToStorage(arrayOfSelectedAnswers)
{
    localStorage.setItem('answer', JSON.stringify(arrayOfSelectedAnswers));
}

(function() {
	var testElement;

	var newForm;

	var indexOfAnswerInTest = 0;

	var arrayOfSelectedAnswers = [];

	window.onload = function() {

		testElement = document.getElementById('test');
		let wrapper = document.getElementById('wrapper');

		removeTextNodes(wrapper);
		removeTextNodes(testElement);

	    {
	        const countQuestions = test_array.length;
	        let el = document.getElementById('num_all_questions');
	        el.innerHTML = '/' + countQuestions.toString();
	    }

		if (localStorage.getItem('indexOfAnswerInTest'))
        {
			indexOfAnswerInTest = +localStorage.getItem('indexOfAnswerInTest');
			moveToNextForm();

			var st = document.getElementById('start');
			document.getElementById('buttons').style.display = 'block';
			st.style.display = 'none';
		}
	}

    function answer()
    {
        var textArea = document.getElementsByTagName('textarea')[0];

        var inputs = newForm.elements;

        let inputs_with_index = Array.prototype.map.call(inputs, (input, index) => {
            return {'input': input, 'index': index};
        });

        let selected_inputs = Array.prototype.filter.call(inputs_with_index, (input) => {
            return input['input'].checked;
        });

        console.assert(selected_inputs.length == 1);

        let temp_array = Array.prototype.map.call(selected_inputs, (input) => {
            return input['index'] + 1;
        });

        //console.log(indexOfAnswerInTest);
        //console.log(temp_array);
        //console.log(test_array[indexOfAnswerInTest].answer_index);

        {
            arrayOfSelectedAnswers[indexOfAnswerInTest] = (temp_array).toString();
            saveAnswersToStorage(arrayOfSelectedAnswers);
        }

        let array2 = test_array[indexOfAnswerInTest].answer_index;
        if (temp_array.length === array2.length && temp_array.every((value, index) => value === array2[index])) {
            textArea.value = "Ответ правильный";
        } else {
            textArea.value = "Ответ неправильный. " + "Правильный ответ: " + (test_array[indexOfAnswerInTest].answer_index).toString();
        }
    }

    function moveToNextForm()
    {
        localStorage.setItem('indexOfAnswerInTest', indexOfAnswerInTest);

        arrayOfSelectedAnswers = loadAnswersFromStorage();

        newForm = document.createElement('form');
        var question = document.createElement('p');
        question.innerHTML = (indexOfAnswerInTest + 1) + ') ' + test_array[indexOfAnswerInTest].question;

        newForm.appendChild(question);

        {
            const inputs = test_array[indexOfAnswerInTest].options;

            let k = arrayOfSelectedAnswers[indexOfAnswerInTest];

            const len = inputs.length;

            let new_inputs = Array.prototype.map.call(inputs, (input) => {
                let label = document.createElement('label');
                label.innerHTML = input;

                let newInput = document.createElement('input');
                newInput.setAttribute('type', 'radio');
                newInput.id = "answer";
                newInput.onclick = answer;
                newInput.setAttribute('name', 'input');

                newForm.appendChild(newInput);
                newForm.appendChild(label);
                newForm.appendChild(document.createElement('br'));

                return newInput;
            });

            //console.log(indexOfAnswerInTest);
            //console.log(k);

            if (k != undefined && typeof k == "string")
            {
                answers = k.split(",");

                Array.prototype.forEach.call(answers, (answer) => {
                    new_inputs[+answer - 1].checked = "true";
                });
            }
        }

        insertAfter(newForm, document.body.firstElementChild.firstElementChild);
    }

    document.getElementById('start').onclick = function() {
        moveToNextForm();
        document.getElementById('buttons').style.display = 'block';
        this.style.display = 'none';
    }

    document.getElementById('back').onclick = prevQuestion;

    function prevQuestion()
    {
        if (indexOfAnswerInTest >= 1)
        {
            --indexOfAnswerInTest;
            var textArea = document.getElementsByTagName('textarea')[0];
            textArea.value = '';

            newForm.remove();
            moveToNextForm();
        }
    }

    document.getElementById('forward').onclick = nextQuestion;

    document.getElementById('goto').onclick = gotoQuestion;

    function gotoQuestion()
    {
        let question_number = document.getElementById('number_question');

        if (+question_number.value < 1)
        {
            alert("Введите положительное число от 1 до суммарного количества вопросов.");
        }

        indexOfAnswerInTest = (+question_number.value - 1);
        question_number.value = '';

        var textArea = document.getElementsByTagName('textarea')[0];
        textArea.value = '';

        newForm.remove();
        moveToNextForm();
    }

    function nextQuestion()
    {
        const countQuestions = testElement.childNodes.length;
        indexOfAnswerInTest += 1;
        if (indexOfAnswerInTest != countQuestions) {
            var textArea = document.getElementsByTagName('textarea')[0];
            textArea.value = '';

            newForm.remove();
            moveToNextForm();
        } else {
            alert("Это был последний вопрос.");
        }
    }

    document.getElementById('clear').onclick = function() {
        localStorage.clear();
    }

})();
