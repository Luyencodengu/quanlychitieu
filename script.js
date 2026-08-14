const STORAGE_KEY = "so-chi-tieu-v1";

const elements = {
  balanceForm: document.querySelector("#balanceForm"),
  balanceInput: document.querySelector("#balanceInput"),
  balanceError: document.querySelector("#balanceError"),

  expenseForm: document.querySelector("#expenseForm"),
  expenseName: document.querySelector("#expenseName"),
  expenseAmount: document.querySelector("#expenseAmount"),
  expenseDate: document.querySelector("#expenseDate"),
  expenseError: document.querySelector("#expenseError"),

  currentBalance: document.querySelector("#currentBalance"),
  totalExpense: document.querySelector("#totalExpense"),
  transactionCount: document.querySelector("#transactionCount"),

  balanceHint: document.querySelector("#balanceHint"),
  expenseHint: document.querySelector("#expenseHint"),

  transactionList: document.querySelector("#transactionList"),
  emptyState: document.querySelector("#emptyState"),
  clearAllButton: document.querySelector("#clearAllButton"),

  todayLabel: document.querySelector("#todayLabel"),
  toast: document.querySelector("#toast"),
};

let appState = loadState();
let toastTimer;

/* =========================
   ĐỌC DỮ LIỆU ĐÃ LƯU
========================= */

function loadState() {
  try {
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      savedData &&
      Number.isFinite(savedData.startingBalance) &&
      Array.isArray(savedData.expenses)
    ) {
      return {
        startingBalance: Math.max(0, savedData.startingBalance),
        expenses: savedData.expenses.filter(isValidExpense),
      };
    }
  } catch (error) {
    console.warn("Không thể đọc dữ liệu đã lưu:", error);
  }

  return {
    startingBalance: 0,
    expenses: [],
  };
}

/* =========================
   KIỂM TRA KHOẢN CHI
========================= */

function isValidExpense(expense) {
  return (
    expense &&
    typeof expense.id === "string" &&
    typeof expense.name === "string" &&
    Number.isFinite(expense.amount) &&
    expense.amount > 0 &&
    typeof expense.date === "string"
  );
}

/* =========================
   LƯU DỮ LIỆU
========================= */

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

/* =========================
   ĐỊNH DẠNG TIỀN
========================= */

function formatMoney(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

/*
Ví dụ:
5000000 → 5.000.000
*/

function getMoneyDigits(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 15)
    .replace(/^0+(?=\d)/, "");
}

function groupMoneyDigits(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseMoneyInput(input) {
  const digits = getMoneyDigits(input.value);

  if (!digits) {
    return Number.NaN;
  }

  return Number(digits);
}

function formatMoneyInput(input) {
  const oldCursor = input.selectionStart ?? input.value.length;

  const digitsBeforeCursor = input.value
    .slice(0, oldCursor)
    .replace(/\D/g, "").length;

  const digits = getMoneyDigits(input.value);
  const formattedValue = groupMoneyDigits(digits);

  input.value = formattedValue;

  if (document.activeElement !== input) {
    return;
  }

  let newCursor = 0;
  let digitsSeen = 0;

  while (
    newCursor < formattedValue.length &&
    digitsSeen < digitsBeforeCursor
  ) {
    if (/\d/.test(formattedValue[newCursor])) {
      digitsSeen += 1;
    }

    newCursor += 1;
  }

  input.setSelectionRange(newCursor, newCursor);
}

/* =========================
   ĐỊNH DẠNG NGÀY
========================= */

function formatDate(dateString) {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getLocalDateValue(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================
   TẠO GIAO DỊCH
========================= */

function createTransactionElement(expense) {
  const item = document.createElement("article");
  item.className = "transaction";

  const mark = document.createElement("span");
  mark.className = "transaction-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "↗";

  const info = document.createElement("div");
  info.className = "transaction-info";

  const name = document.createElement("strong");
  name.textContent = expense.name;

  const date = document.createElement("span");
  date.textContent = formatDate(expense.date);

  const amount = document.createElement("span");
  amount.className = "transaction-amount";
  amount.textContent = `− ${formatMoney(expense.amount)}`;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.type = "button";
  deleteButton.dataset.expenseId = expense.id;

  deleteButton.setAttribute(
    "aria-label",
    `Xóa khoản chi ${expense.name}`
  );

  deleteButton.title = "Xóa khoản chi";
  deleteButton.textContent = "×";

  info.append(name, date);

  item.append(
    mark,
    info,
    amount,
    deleteButton
  );

  return item;
}

/* =========================
   HIỂN THỊ DỮ LIỆU
========================= */

function render() {
  const totalExpense = appState.expenses.reduce(
    (total, item) => total + item.amount,
    0
  );

  const currentBalance =
    appState.startingBalance - totalExpense;

  const hasExpenses =
    appState.expenses.length > 0;

  elements.currentBalance.textContent =
    formatMoney(currentBalance);

  elements.totalExpense.textContent =
    formatMoney(totalExpense);

  elements.transactionCount.textContent =
    String(appState.expenses.length);

  if (appState.startingBalance) {
    elements.balanceHint.textContent =
      `Từ ${formatMoney(appState.startingBalance)} ban đầu`;
  } else {
    elements.balanceHint.textContent =
      "Hãy nhập số tiền bạn đang có";
  }

  if (hasExpenses) {
    elements.expenseHint.textContent =
      `${appState.expenses.length} khoản chi đã ghi lại`;
  } else {
    elements.expenseHint.textContent =
      "Chưa có khoản chi nào";
  }

  elements.currentBalance.classList.toggle(
    "negative-balance",
    currentBalance < 0
  );

  elements.emptyState.hidden = hasExpenses;
  elements.clearAllButton.hidden = !hasExpenses;

  const sortedExpenses = appState.expenses
    .slice()
    .sort((a, b) => {
      return (
        b.date.localeCompare(a.date) ||
        b.createdAt - a.createdAt
      );
    });

  const transactionElements =
    sortedExpenses.map(createTransactionElement);

  elements.transactionList.replaceChildren(
    ...transactionElements
  );
}

/* =========================
   THÔNG BÁO
========================= */

function showToast(message) {
  window.clearTimeout(toastTimer);

  elements.toast.textContent = message;
  elements.toast.classList.add("show");

  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("show");
  }, 2200);
}

/* =========================
   NHẬP SỐ TIỀN HIỆN CÓ
========================= */

elements.balanceForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const balance =
      parseMoneyInput(elements.balanceInput);

    if (
      !Number.isFinite(balance) ||
      balance < 0
    ) {
      elements.balanceError.textContent =
        "Vui lòng nhập số tiền hợp lệ, từ 0 trở lên.";

      elements.balanceInput.focus();
      return;
    }

    elements.balanceError.textContent = "";

    appState.startingBalance = balance;

    saveState();
    render();

    showToast("Đã cập nhật số tiền hiện có.");
  }
);

/* =========================
   THÊM KHOẢN CHI
========================= */

elements.expenseForm.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();

    const name =
      elements.expenseName.value.trim();

    const amount =
      parseMoneyInput(elements.expenseAmount);

    const date =
      elements.expenseDate.value;

    if (!name) {
      elements.expenseError.textContent =
        "Bạn chưa nhập nội dung khoản chi.";

      elements.expenseName.focus();
      return;
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      elements.expenseError.textContent =
        "Số tiền đã chi phải lớn hơn 0.";

      elements.expenseAmount.focus();
      return;
    }

    if (!date) {
      elements.expenseError.textContent =
        "Bạn chưa chọn ngày chi.";

      elements.expenseDate.focus();
      return;
    }

    elements.expenseError.textContent = "";

    const newExpense = {
      id:
        window.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random()}`,

      name: name,
      amount: amount,
      date: date,
      createdAt: Date.now(),
    };

    appState.expenses.push(newExpense);

    saveState();
    render();

    elements.expenseForm.reset();

    elements.expenseDate.value =
      getLocalDateValue();

    elements.expenseName.focus();

    showToast("Đã thêm khoản chi mới.");
  }
);

/* =========================
   XÓA MỘT KHOẢN CHI
========================= */

elements.transactionList.addEventListener(
  "click",
  (event) => {
    const deleteButton =
      event.target.closest("[data-expense-id]");

    if (!deleteButton) {
      return;
    }

    const expenseId =
      deleteButton.dataset.expenseId;

    appState.expenses =
      appState.expenses.filter(
        (expense) => expense.id !== expenseId
      );

    saveState();
    render();

    showToast("Đã xóa khoản chi.");
  }
);

/* =========================
   XÓA TOÀN BỘ LỊCH SỬ
========================= */

elements.clearAllButton.addEventListener(
  "click",
  () => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa toàn bộ lịch sử chi tiêu?"
    );

    if (!confirmed) {
      return;
    }

    appState.expenses = [];

    saveState();
    render();

    showToast("Đã xóa toàn bộ lịch sử.");
  }
);

/* =========================
   TỰ THÊM DẤU CHẤM KHI NHẬP
========================= */

elements.balanceInput.addEventListener(
  "input",
  () => {
    formatMoneyInput(elements.balanceInput);
    elements.balanceError.textContent = "";
  }
);

elements.expenseAmount.addEventListener(
  "input",
  () => {
    formatMoneyInput(elements.expenseAmount);
  }
);

/* Xóa thông báo lỗi khi nhập lại */

elements.expenseForm.addEventListener(
  "input",
  () => {
    elements.expenseError.textContent = "";
  }
);

/* =========================
   KHỞI TẠO ỨNG DỤNG
========================= */

elements.todayLabel.textContent =
  new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

elements.expenseDate.value =
  getLocalDateValue();

elements.balanceInput.value =
  appState.startingBalance
    ? groupMoneyDigits(
        String(appState.startingBalance)
      )
    : "";

render();

/* =========================
   ĐĂNG KÝ SERVICE WORKER
========================= */

if (
  "serviceWorker" in navigator &&
  location.protocol.startsWith("http")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch((error) => {
        console.warn(
          "Không thể bật chế độ ngoại tuyến:",
          error
        );
      });
  });
}