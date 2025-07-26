// Элементы DOM
const mainPage = document.getElementById('main-page');
const resultPage = document.getElementById('result-page');
const form = document.getElementById('numbers-form');
const loading = document.getElementById('loading');
const errorModal = document.getElementById('error-modal');
const errorMessage = document.getElementById('error-message');
const backBtn = document.getElementById('back-btn');
const closeModalBtn = document.getElementById('close-modal');
const modalOkBtn = document.getElementById('modal-ok');

// Элементы формы
const infoTypeSelect = document.getElementById('info-type');
const numberTypeRadios = document.querySelectorAll('input[name="number-type"]');
const numberInputGroup = document.getElementById('number-input-group');
const numberInput = document.getElementById('number-input');
const dateInputs = document.getElementById('date-inputs');
const monthInput = document.getElementById('month-input');
const dayInput = document.getElementById('day-input');

// Элементы результатов
const userInfo = document.getElementById('user-info');
const factsContent = document.getElementById('facts-content');

// Переменные для хранения данных
let currentRequest = {};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

// Настройка обработчиков событий
function setupEventListeners() {
  // Обработчик формы
  form.addEventListener('submit', handleFormSubmit);

  // Обработчик типа информации
  infoTypeSelect.addEventListener('change', handleInfoTypeChange);

  // Обработчики радио кнопок
  numberTypeRadios.forEach((radio) => {
    radio.addEventListener('change', handleNumberTypeChange);
  });

  // Обработчик кнопки "Назад"
  backBtn.addEventListener('click', () => {
    showPage('main');
  });

  // Обработчики модального окна
  closeModalBtn.addEventListener('click', hideErrorModal);
  modalOkBtn.addEventListener('click', hideErrorModal);

  // Закрытие модального окна по клику вне его
  errorModal.addEventListener('click', (e) => {
    if (e.target === errorModal) {
      hideErrorModal();
    }
  });

  // Закрытие модального окна по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && errorModal.classList.contains('show')) {
      hideErrorModal();
    }
  });
}

// Обработчик изменения типа информации
function handleInfoTypeChange() {
  const selectedType = infoTypeSelect.value;

  if (selectedType === 'date') {
    dateInputs.style.display = 'block';
    numberInputGroup.style.display = 'none';
    // Сбрасываем выбор случайного числа для дат
    document.querySelector(
      'input[name="number-type"][value="custom"]'
    ).checked = true;
    handleNumberTypeChange();
  } else {
    dateInputs.style.display = 'none';
    // Возвращаем возможность выбора случайного числа
    if (
      document.querySelector('input[name="number-type"][value="random"]')
        .checked
    ) {
      numberInputGroup.style.display = 'none';
    }
  }
}

// Обработчик изменения типа выбора числа
function handleNumberTypeChange() {
  const selectedType = document.querySelector(
    'input[name="number-type"]:checked'
  ).value;
  const infoType = infoTypeSelect.value;

  if (selectedType === 'custom' || infoType === 'date') {
    numberInputGroup.style.display = 'block';
    if (infoType === 'date') {
      numberInput.style.display = 'none';
    } else {
      numberInput.style.display = 'block';
    }
  } else {
    numberInputGroup.style.display = 'none';
  }
}

// Обработчик отправки формы
async function handleFormSubmit(e) {
  e.preventDefault();

  try {
    // Получаем данные формы
    const formData = getFormData();

    // Валидация
    const validation = validateFormData(formData);
    if (!validation.isValid) {
      showError(validation.message);
      return;
    }

    // Сохраняем данные запроса
    currentRequest = formData;

    // Показываем лоадер
    showLoading();

    // Получаем факты
    const facts = await fetchFacts(formData);

    // Скрываем лоадер
    hideLoading();

    // Отображаем результаты
    displayResults(formData, facts);

    // Переходим на страницу результатов
    showPage('result');
  } catch (error) {
    hideLoading();
    console.error('Ошибка:', error);
    showError(
      'Произошла ошибка при получении данных. Проверьте интернет-соединение и попробуйте снова.'
    );
  }
}

// Получение данных формы
function getFormData() {
  const infoType = infoTypeSelect.value;
  const numberType = document.querySelector(
    'input[name="number-type"]:checked'
  ).value;

  const data = {
    infoType,
    numberType,
  };

  if (infoType === 'date') {
    data.month = monthInput.value;
    data.day = dayInput.value;
  } else if (numberType === 'custom') {
    data.number = numberInput.value;
  }

  return data;
}

// Валидация данных формы
function validateFormData(data) {
  // Проверка выбора типа информации
  if (!data.infoType) {
    return { isValid: false, message: 'Пожалуйста, выберите тип информации.' };
  }

  // Валидация для дат
  if (data.infoType === 'date') {
    if (!data.month || !data.day) {
      return {
        isValid: false,
        message: 'Пожалуйста, введите месяц и день для даты.',
      };
    }

    const month = parseInt(data.month);
    const day = parseInt(data.day);

    if (isNaN(month) || month < 1 || month > 12) {
      return {
        isValid: false,
        message: 'Месяц должен быть числом от 1 до 12.',
      };
    }

    if (isNaN(day) || day < 1 || day > 31) {
      return { isValid: false, message: 'День должен быть числом от 1 до 31.' };
    }

    // Проверка валидности даты
    const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) {
      return {
        isValid: false,
        message: `В ${month} месяце не может быть ${day} дней.`,
      };
    }
  }

  // Валидация для пользовательского числа
  if (data.numberType === 'custom' && data.infoType !== 'date') {
    if (!data.number || data.number.trim() === '') {
      return { isValid: false, message: 'Пожалуйста, введите число.' };
    }

    const number = parseInt(data.number);
    if (isNaN(number)) {
      return { isValid: false, message: 'Число должно быть в виде цифры.' };
    }

    if (number < 0) {
      return { isValid: false, message: 'Число должно быть положительным.' };
    }
  }

  return { isValid: true };
}

// Получение фактов с API
async function fetchFacts(data) {
  const facts = [];
  const baseUrl = 'http://numbersapi.com';

  if (data.infoType === 'date') {
    // Факты о дате
    const dateUrl = `${baseUrl}/${data.month}/${data.day}/date?json`;
    const response = await fetch(dateUrl);
    if (!response.ok) throw new Error('Ошибка при получении факта о дате');
    const fact = await response.json();
    facts.push({
      type: 'date',
      number: `${data.day}.${data.month}`,
      text: fact.text,
    });
  } else {
    // Факты о числах
    let numbers = [];

    if (data.numberType === 'random') {
      // Получаем несколько случайных чисел
      numbers = [
        {
          url: `${baseUrl}/random/${data.infoType}?json`,
          label: 'Случайное число',
        },
        {
          url: `${baseUrl}/random/${data.infoType}?json`,
          label: 'Ещё одно случайное число',
        },
        {
          url: `${baseUrl}/random/${data.infoType}?json`,
          label: 'И ещё одно случайное число',
        },
      ];
    } else {
      // Используем заданное число
      const number = parseInt(data.number);
      numbers = [
        {
          url: `${baseUrl}/${number}/${data.infoType}?json`,
          label: `Число ${number}`,
        },
      ];
    }

    // Получаем факты для всех чисел
    for (const numData of numbers) {
      try {
        const response = await fetch(numData.url);
        if (!response.ok)
          throw new Error(`Ошибка при получении факта для ${numData.label}`);
        const fact = await response.json();
        facts.push({
          type: data.infoType,
          number: fact.text.match(/^\d+/)
            ? fact.text.match(/^\d+/)[0]
            : numData.label,
          text: fact.text,
        });
      } catch (error) {
        console.error(`Ошибка для ${numData.label}:`, error);
        // Добавляем заглушку при ошибке
        facts.push({
          type: data.infoType,
          number: numData.label,
          text: `К сожалению, не удалось получить факт для ${numData.label.toLowerCase()}.`,
        });
      }
    }
  }

  return facts;
}

// Отображение результатов
function displayResults(formData, facts) {
  // Отображение информации о запросе пользователя
  displayUserInfo(formData);

  // Отображение фактов
  displayFacts(facts);
}

// Отображение информации о запросе пользователя
function displayUserInfo(data) {
  const typeNames = {
    'trivia': 'Интересные факты (Trivia)',
    'math': 'Математические факты (Math)',
    'date': 'Факты о датах (Date)',
  };

  let html = `
        <div class="user-info-item">
            <strong>Тип информации:</strong> ${typeNames[data.infoType]}
        </div>
    `;

  if (data.infoType === 'date') {
    html += `
            <div class="user-info-item">
                <strong>Дата:</strong> ${data.day}.${data.month}
            </div>
        `;
  } else {
    html += `
            <div class="user-info-item">
                <strong>Способ выбора:</strong> ${
                  data.numberType === 'random'
                    ? 'Случайные числа'
                    : 'Заданное число'
                }
            </div>
        `;

    if (data.numberType === 'custom') {
      html += `
                <div class="user-info-item">
                    <strong>Выбранное число:</strong> ${data.number}
                </div>
            `;
    }
  }

  userInfo.innerHTML = html;
}

// Отображение фактов
function displayFacts(facts) {
  let html = '';

  facts.forEach((fact, index) => {
    html += `
            <div class="fact-item" style="animation-delay: ${index * 0.1}s">
                <div class="fact-number">${fact.number}</div>
                <div class="fact-text">${fact.text}</div>
            </div>
        `;
  });

  factsContent.innerHTML = html;
}

// Переключение страниц
function showPage(pageName) {
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.remove('active');
  });

  if (pageName === 'main') {
    mainPage.classList.add('active');
  } else if (pageName === 'result') {
    resultPage.classList.add('active');
  }
}

// Показ лоадера
function showLoading() {
  loading.classList.add('show');
}

// Скрытие лоадера
function hideLoading() {
  loading.classList.remove('show');
}

// Показ ошибки
function showError(message) {
  errorMessage.textContent = message;
  errorModal.classList.add('show');
}

// Скрытие модального окна ошибки
function hideErrorModal() {
  errorModal.classList.remove('show');
}

// Обработка ошибок fetch
window.addEventListener('unhandledrejection', (event) => {
  console.error('Необработанная ошибка Promise:', event.reason);
  hideLoading();
  showError('Произошла неожиданная ошибка. Пожалуйста, попробуйте снова.');
});

// Обработка ошибок JavaScript
window.addEventListener('error', (event) => {
  console.error('Ошибка JavaScript:', event.error);
  hideLoading();
  showError(
    'Произошла ошибка в приложении. Пожалуйста, перезагрузите страницу.'
  );
});
