const STORAGE_KEY = "so-chi-tieu-v1";
const CATEGORY_KEY = "expense-categories";

let categories = JSON.parse(localStorage.getItem(CATEGORY_KEY)) || [];
let activePage = localStorage.getItem("activePage") || categories[0]?.id || "";

function getStorageKey() {
  return `${STORAGE_KEY}-${activePage}`;
}
const elements = {
  balanceForm: document.querySelector("#balanceForm"),
  balanceInput: document.querySelector("#balanceInput"),
  balanceError: document.querySelector("#balanceError"),
  pageTabs: document.querySelector("#pageTabs"),
  categoryInput: document.querySelector("#categoryInput"),
  addCategoryButton: document.querySelector("#addCategoryButton"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseName: document.querySelector("#expenseName"),
  expenseAmount: document.querySelector("#expenseAmount"),
  expenseDate: document.querySelector("#expenseDate"),
  expenseError: document.querySelector("#expenseError"),

  currentBalance: document.querySelector("#currentBalance"),
  toolbarBalance: document.querySelector("#toolbarBalance"),
  drawerBalance: document.querySelector("#drawerBalance"),
  totalExpense: document.querySelector("#totalExpense"),
  transactionCount: document.querySelector("#transactionCount"),

  balanceHint: document.querySelector("#balanceHint"),
  expenseHint: document.querySelector("#expenseHint"),

  transactionList: document.querySelector("#transactionList"),
  emptyState: document.querySelector("#emptyState"),
  clearAllButton: document.querySelector("#clearAllButton"),
  resetAllButton: document.querySelector("#resetAllButton"),

  todayLabel: document.querySelector("#todayLabel"),
  toast: document.querySelector("#toast"),
  categoryModal: document.querySelector("#categoryModal"),
openCategoryModal: document.querySelector("#openCategoryModal"),
closeCategoryModal: document.querySelector("#closeCategoryModal"),
currentCategoryName: document.querySelector("#currentCategoryName"),
showCategoryListButton: document.querySelector("#showCategoryListButton"),
showAddCategoryButton: document.querySelector("#showAddCategoryButton"),
categoryListPanel: document.querySelector("#categoryListPanel"),
categoryAddPanel: document.querySelector("#categoryAddPanel"),
balanceModal: document.querySelector("#balanceModal"),
openBalanceModal: document.querySelector("#openBalanceModal"),
closeBalanceModal: document.querySelector("#closeBalanceModal"),
};

let appState = loadState();
let toastTimer;

/* =========================
   ĐỌC DỮ LIỆU ĐÃ LƯU
========================= */

function loadState() {
  try {
    const savedData = JSON.parse(localStorage.getItem(getStorageKey()));

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
  localStorage.setItem(getStorageKey(), JSON.stringify(appState));
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
  elements.toolbarBalance.textContent =
    formatMoney(currentBalance);
  elements.drawerBalance.textContent =
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

    appState.startingBalance += balance;
    elements.balanceInput.value = "";

    saveState();
    render();
    hideBalanceModal();

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

document.querySelector(".expense-suggestions").addEventListener("click", (event) => {
  const suggestion = event.target.closest("[data-expense-suggestion]");
  if (!suggestion) return;

  elements.expenseName.value = suggestion.dataset.expenseSuggestion;
  elements.expenseError.textContent = "";
  elements.expenseAmount.focus();
});

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
function showCategoryModal() {
  hideBalanceModal();
  elements.categoryModal.classList.add("show");
  document.body.classList.add("modal-open");
}

function hideCategoryModal() {
  elements.categoryModal.classList.remove("show");
  document.body.classList.remove("modal-open");
}

document.addEventListener("click", (event) => {
  const addThousandsButton = event.target.closest("[data-add-thousands]");
  if (!addThousandsButton) return;

  const input = document.getElementById(addThousandsButton.dataset.addThousands);
  const currentDigits = getMoneyDigits(input.value);

  if (!currentDigits) {
    input.focus();
    showToast("Hãy nhập một con số trước.");
    return;
  }

  input.value = `${currentDigits}000`.slice(0, 15);
  formatMoneyInput(input);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
});
function showBalanceModal() {
  hideCategoryModal();
  elements.balanceModal.classList.add("show");
  document.body.classList.add("modal-open");
  setTimeout(() => elements.balanceInput.focus(), 280);
}

function hideBalanceModal() {
  elements.balanceModal.classList.remove("show");
  if (!elements.categoryModal.classList.contains("show")) {
    document.body.classList.remove("modal-open");
  }
}
function saveCategories() {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));

  if (activePage) {
    localStorage.setItem("activePage", activePage);
  } else {
    localStorage.removeItem("activePage");
  }
}

function openCategory(categoryId) {
  activePage = categoryId;
  saveCategories();

  appState = loadState();
  elements.balanceInput.value = "";
  elements.expenseForm.reset();
  elements.expenseDate.value = getLocalDateValue();

  renderCategories();
  render();
  hideCategoryModal();
}
function hideCategoryActions() {
  document.querySelectorAll(".category-row.show-actions").forEach((row) => {
    row.classList.remove("show-actions");
  });
}

document.addEventListener("click", hideCategoryActions);
function renderCategories() {
  elements.pageTabs.innerHTML = "";

  const currentCategory = categories.find(
    (category) => category.id === activePage
  );

  elements.currentCategoryName.textContent =
    currentCategory?.name || "Chưa chọn";

  if (categories.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "category-empty";
    emptyMessage.textContent = "Chưa có mục nào. Hãy tạo mục đầu tiên.";
    elements.pageTabs.appendChild(emptyMessage);
    return;
  }

  categories.forEach((category, index) => {
    const row = document.createElement("div");
    row.className = "category-row";
    row.style.setProperty("--category-index", index);
    let longPressed = false;
    let pressTimer;

    row.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideCategoryActions();
      row.classList.add("show-actions");
    });

    row.addEventListener("touchstart", () => {
      longPressed = false;
      pressTimer = setTimeout(() => {
        longPressed = true;
        hideCategoryActions();
        row.classList.add("show-actions");
      }, 550);
    }, { passive: true });

    row.addEventListener("touchend", () => clearTimeout(pressTimer));
    row.addEventListener("touchmove", () => clearTimeout(pressTimer), { passive: true });

    if (category.id === activePage) {
      row.classList.add("active");
    }

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "category-select";
    const categoryIcon = document.createElement("span");
    categoryIcon.className = "category-icon";
    categoryIcon.textContent = category.name.trim().charAt(0).toUpperCase() || "₫";

    const categoryText = document.createElement("span");
    categoryText.className = "category-text";
    const categoryTitle = document.createElement("strong");
    categoryTitle.textContent = category.name;
    const categoryHint = document.createElement("small");
    categoryHint.textContent = "Chạm để xem chi tiết";
    categoryText.append(categoryTitle, categoryHint);

    const categoryArrow = document.createElement("span");
    categoryArrow.className = "category-arrow";
    categoryArrow.textContent = "›";
    selectButton.append(categoryIcon, categoryText, categoryArrow);

    selectButton.addEventListener("click", () => {
      if (longPressed) {
        longPressed = false;
        return;
      }
      openCategory(category.id);
    });
    const actions = document.createElement("div");
    actions.className = "category-actions";

    const renameButton = document.createElement("button");
    renameButton.type = "button";
    renameButton.title = "Đổi tên";
    renameButton.textContent = "✎";

    renameButton.addEventListener("click", () => {
      const newName = prompt("Nhập tên mới:", category.name)?.trim();

      if (!newName) return;

      category.name = newName;
      saveCategories();
      renderCategories();
      showToast("Đã đổi tên mục.");
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-category";
    deleteButton.title = "Xóa mục";
    deleteButton.textContent = "×";

    deleteButton.addEventListener("click", () => {
      if (!confirm(`Xóa mục "${category.name}" và toàn bộ dữ liệu?`)) return;

      localStorage.removeItem(`${STORAGE_KEY}-${category.id}`);
      categories = categories.filter((item) => item.id !== category.id);

      if (activePage === category.id) {
        activePage = categories[0]?.id || "";
        appState = loadState();
      }

      saveCategories();
      renderCategories();
      render();
      showToast("Đã xóa mục.");
    });

    actions.append(renameButton, deleteButton);
    row.append(selectButton, actions);
    elements.pageTabs.appendChild(row);
  });
}

elements.openCategoryModal.addEventListener("click", showCategoryModal);
elements.openBalanceModal.addEventListener("click", showBalanceModal);
elements.closeBalanceModal.addEventListener("click", hideBalanceModal);
elements.balanceModal.addEventListener("click", (event) => {
  if (event.target === elements.balanceModal) hideBalanceModal();
});
elements.closeCategoryModal.addEventListener("click", hideCategoryModal);

elements.categoryModal.addEventListener("click", (event) => {
  if (event.target === elements.categoryModal) {
    hideCategoryModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideCategoryModal();
    hideBalanceModal();
  }
});
elements.categoryInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    elements.addCategoryButton.click();
  }
});

elements.addCategoryButton.addEventListener("click", () => {
  const name = elements.categoryInput.value.trim();

  if (!name) {
    showToast("Hãy nhập tên mục chi tiêu.");
    return;
  }

  const category = {
    id: `category-${Date.now()}`,
    name: name,
  };

  categories.push(category);
  activePage = category.id;

  localStorage.setItem(CATEGORY_KEY, JSON.stringify(categories));
  localStorage.setItem("activePage", activePage);

  appState = loadState();
  elements.categoryInput.value = "";

  renderCategories();
  render();
});
function toggleDrawerPanel(panelName) {
  const isList = panelName === "list";
  const selectedPanel = isList
    ? elements.categoryListPanel
    : elements.categoryAddPanel;

  const shouldOpen = selectedPanel.hidden;

  elements.categoryListPanel.hidden = true;
  elements.categoryAddPanel.hidden = true;

  elements.showCategoryListButton.classList.remove("active");
  elements.showAddCategoryButton.classList.remove("active");

  if (shouldOpen) {
    selectedPanel.hidden = false;

    if (isList) {
      elements.showCategoryListButton.classList.add("active");
    } else {
      elements.showAddCategoryButton.classList.add("active");
      elements.categoryInput.focus();
    }
  }
}

elements.showCategoryListButton.addEventListener("click", () => {
  toggleDrawerPanel("list");
});

elements.showAddCategoryButton.addEventListener("click", () => {
  toggleDrawerPanel("add");
});
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

elements.balanceInput.value = "";

renderCategories();
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
  elements.resetAllButton.addEventListener("click", () => {
  if (!confirm("Reset toàn bộ số tiền và khoản chi?")) return;
  appState = { startingBalance: 0, expenses: [] };
  saveState();
  render();
  elements.balanceInput.value = "";
  showToast("Đã reset toàn bộ dữ liệu.");
});
}
