const API_URL = "/api/promises";
const AUTH_API = "/api/auth";


// =====================================================
// 页面切换
// =====================================================

function showScreen(screenId) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {
            screen.classList.remove("active");
        });

    const target =
        document.getElementById(screenId);

    if (target) {
        target.classList.add("active");
    }

    window.scrollTo(0, 0);

    // 打开创建约定页面时，加载约定对象
    if (screenId === "screen-create") {
        loadPromisePartners();
    }

    // 打开约定对象管理页面时，刷新对象列表
    if (screenId === "screen-partners") {
        loadPartners();
    }
}


// =====================================================
// Toast
// =====================================================

function showToast(text) {

    const toast =
        document.getElementById("toast");

    toast.textContent = text;

    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}


// =====================================================
// 防止约定内容中的 HTML 破坏页面
// =====================================================

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// =====================================================
// 状态文字
// =====================================================

function getStatusText(status) {

    const statusMap = {
        DRAFT: "草稿",
        WAITING: "等待确认",
        ACTIVE: "进行中",
        IN_PROGRESS: "进行中",
        COMPLETED: "已完成",
        EXPIRED: "已过期",
        CANCELLED: "已取消"
    };

    return statusMap[status] || status || "进行中";
}


// =====================================================
// 开场 → 登录 / 注册
// =====================================================

document
    .getElementById("startBtn")
    .onclick = () => {

        showScreen("screen-auth");

    };


// =====================================================
// 登录 / 注册选择
// =====================================================

const authChoice =
    document.getElementById("auth-choice");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");


document
    .getElementById("showLoginBtn")
    .onclick = () => {

        authChoice.classList.add("hidden");

        loginForm.classList.remove("hidden");

    };


document
    .getElementById("showRegisterBtn")
    .onclick = () => {

        authChoice.classList.add("hidden");

        registerForm.classList.remove("hidden");

    };


// =====================================================
// 返回登录 / 注册选择
// =====================================================

function backToAuthChoice() {

    loginForm.classList.add("hidden");

    registerForm.classList.add("hidden");

    authChoice.classList.remove("hidden");

}


document
    .getElementById("backToAuthChoice1")
    .onclick = backToAuthChoice;


document
    .getElementById("backToAuthChoice2")
    .onclick = backToAuthChoice;


// =====================================================
// 注册
// =====================================================

registerForm.onsubmit = async function (e) {

    e.preventDefault();

    const username =
        document
            .getElementById("registerUsername")
            .value
            .trim();

    const nickname =
        document
            .getElementById("registerNickname")
            .value
            .trim();

    const password =
        document
            .getElementById("registerPassword")
            .value;

    if (!username || !nickname || !password) {

        showToast("请把信息填写完整");

        return;
    }

    try {

        const response =
            await fetch(
                `${AUTH_API}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({
                        username,
                        nickname,
                        password
                    })
                }
            );

        const data =
            await response.json().catch(() => ({}));

        if (!response.ok) {

            showToast(
                typeof data === "string"
                    ? data
                    : typeof data?.message === "string"
                        ? data.message
                        : "注册失败"
            );

            return;
        }

        showToast("✨ 注册成功，请登录");

        registerForm.reset();

        registerForm.classList.add("hidden");

        loginForm.classList.remove("hidden");

        document
            .getElementById("loginUsername")
            .value = username;

    } catch (error) {

        console.error(error);

        showToast("无法连接服务器");

    }

};


// =====================================================
// 登录
// =====================================================

loginForm.onsubmit = async function (e) {

    e.preventDefault();

    const username =
        document
            .getElementById("loginUsername")
            .value
            .trim();

    const password =
        document
            .getElementById("loginPassword")
            .value;

    try {

        const response =
            await fetch(
                `${AUTH_API}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials: "same-origin",

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

        const data =
            await response.json().catch(() => ({}));

        if (!response.ok) {

            showToast(
                typeof data === "string"
                    ? data
                    : typeof data?.message === "string"
                        ? data.message
                        : "用户名或密码错误"
            );

            return;
        }

        console.log("登录成功：", data);

        document
            .getElementById("currentNickname")
            .textContent =
            data.nickname;

        loginForm.reset();

        showScreen("screen-menu");

        showToast(
            `欢迎回来，${data.nickname} 👋`
        );

    } catch (error) {

        console.error(error);

        showToast("无法连接服务器");

    }

};


// =====================================================
// 退出登录
// =====================================================

document
    .getElementById("logoutBtn")
    .onclick = async function () {

        try {

            const response =
                await fetch(
                    `${AUTH_API}/logout`,
                    {
                        method: "POST",
                        credentials: "same-origin"
                    }
                );

            if (response.ok) {

                showToast("已经退出登录");

                setTimeout(() => {

                    showScreen("screen-intro");

                }, 500);

            }

        } catch (error) {

            console.error(error);

            showToast("退出登录失败");

        }

    };


// =====================================================
// 页面按钮跳转
// =====================================================

document
    .querySelectorAll("[data-target]")
    .forEach(btn => {

        btn.onclick = () => {

            showScreen(
                btn.dataset.target
            );

        };

    });


// =====================================================
// 获取当前登录用户
// =====================================================

async function checkLogin() {

    try {

        const response =
            await fetch(
                `${AUTH_API}/me`,
                {
                    credentials: "same-origin"
                }
            );

        if (!response.ok) {

            return null;

        }

        const user =
            await response.json();

        document
            .getElementById("currentNickname")
            .textContent =
            user.nickname;

        return user;

    } catch (error) {

        console.error(error);

        return null;

    }

}


// =====================================================
// 加载约定
// =====================================================

async function loadPromises() {

    try {

        const response =
            await fetch(
                API_URL,
                {
                    credentials: "same-origin"
                }
            );

        if (!response.ok) {

            if (response.status === 401) {
                showToast("请先登录");
            } else {
                showToast("获取约定失败");
            }

            return;

        }

        const promises =
            await response.json();

        renderPromises(promises);

    } catch (e) {

        console.error(e);

        showToast("无法连接后端");

    }

}


// =====================================================
// 渲染约定
// =====================================================

function renderPromises(promises) {

    const list =
        document.getElementById(
            "promiseList"
        );

    const count =
        document.getElementById(
            "promiseCount"
        );

    count.textContent =
        `${promises.length} 个约定`;

    list.innerHTML = "";

    if (promises.length === 0) {

        list.innerHTML = `
            <div class="promise-card empty-promise-card">
                <div class="empty-jar">🫙</div>
                <p>
                    罐子里还没有约定，
                    去创建第一个吧。
                </p>
            </div>
        `;

        return;
    }

    promises.forEach(p => {

        const card =
            document.createElement("div");

        card.className =
            "promise-card";

        card.innerHTML = `

            <h3>
                ${escapeHtml(p.title)}
            </h3>

            <div class="promise-description">
                ${escapeHtml(p.description || "")}
            </div>

            <div class="promise-info">

                ${p.location
                ? `<span>📍 ${escapeHtml(p.location)}</span>`
                : ""
            }

                ${p.promiseDate
                ? `<span>📅 ${escapeHtml(p.promiseDate)}</span>`
                : ""
            }

            </div>

            <div class="promise-status">
                ${escapeHtml(getStatusText(p.status))}
            </div>

            <div class="promise-actions">

                <button
                    class="promise-action-btn view-btn"
                    onclick="viewPromise(${p.id})">
                    查看
                </button>

                <button
                    class="promise-action-btn edit-btn"
                    onclick="editPromise(${p.id})">
                    编辑
                </button>

                <button
                    class="promise-action-btn delete-btn"
                    onclick="deletePromise(${p.id})">
                    删除
                </button>

            </div>

        `;

        list.appendChild(card);

    });

}


// =====================================================
// 创建约定
// =====================================================

document
    .getElementById("promiseForm")
    .onsubmit = async function (e) {

        e.preventDefault();

        const payload = {

            title:
                document
                    .getElementById("title")
                    .value
                    .trim(),

            description:
                document
                    .getElementById("description")
                    .value
                    .trim(),

            location:
                document
                    .getElementById("location")
                    .value
                    .trim(),

            promiseDate:
                document
                    .getElementById("promiseDate")
                    .value

        };

        try {

            const response =
                await fetch(
                    API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify(payload)
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "创建约定失败"
                );

            }

            e.target.reset();

            showToast(
                "🫙 约定已经存入罐子"
            );

            setTimeout(() => {

                showScreen("screen-list");

                loadPromises();

            }, 500);

        } catch (error) {

            console.error(error);

            showToast(
                "约定保存失败"
            );

        }

    };


// =====================================================
// 查看一个约定
// =====================================================

async function viewPromise(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    credentials: "same-origin"
                }
            );

        if (!response.ok) {

            if (response.status === 401) {
                showToast("请先登录");
                return;
            }

            if (response.status === 404) {
                showToast("找不到这个约定");
                return;
            }

            throw new Error("获取约定失败");
        }

        const promise =
            await response.json();

        document
            .getElementById("detailTitle")
            .textContent =
            promise.title || "未命名约定";

        document
            .getElementById("detailDescription")
            .textContent =
            promise.description || "没有填写约定内容";

        document
            .getElementById("detailLocation")
            .textContent =
            promise.location
                ? `📍 ${promise.location}`
                : "📍 未设置地点";

        document
            .getElementById("detailDate")
            .textContent =
            promise.promiseDate
                ? `📅 ${promise.promiseDate}`
                : "📅 未设置日期";

        document
            .getElementById("detailStatus")
            .textContent =
            `状态：${getStatusText(promise.status)}`;

        document
            .getElementById("detailCreatedAt")
            .textContent =
            promise.createdAt
                ? `创建时间：${formatDateTime(promise.createdAt)}`
                : "";

        document
            .getElementById("detailEditBtn")
            .onclick = () => {
                editPromise(promise.id);
            };

        showScreen("screen-detail");

    } catch (error) {

        console.error(error);

        showToast("无法获取约定");

    }

}


// =====================================================
// 编辑约定
// =====================================================

async function editPromise(id) {

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    credentials: "same-origin"
                }
            );

        if (!response.ok) {

            showToast("无法获取约定");

            return;
        }

        const promise =
            await response.json();

        document
            .getElementById("editPromiseId")
            .value =
            promise.id;

        document
            .getElementById("editTitle")
            .value =
            promise.title || "";

        document
            .getElementById("editDescription")
            .value =
            promise.description || "";

        document
            .getElementById("editLocation")
            .value =
            promise.location || "";

        document
            .getElementById("editPromiseDate")
            .value =
            promise.promiseDate || "";

        document
            .getElementById("editStatus")
            .value =
            promise.status || "ACTIVE";

        showScreen("screen-edit");

    } catch (error) {

        console.error(error);

        showToast("无法获取约定");

    }

}


// =====================================================
// 提交编辑
// =====================================================

document
    .getElementById("editPromiseForm")
    .onsubmit = async function (e) {

        e.preventDefault();

        const id =
            document
                .getElementById("editPromiseId")
                .value;

        const payload = {

            title:
                document
                    .getElementById("editTitle")
                    .value
                    .trim(),

            description:
                document
                    .getElementById("editDescription")
                    .value
                    .trim(),

            location:
                document
                    .getElementById("editLocation")
                    .value
                    .trim(),

            promiseDate:
                document
                    .getElementById("editPromiseDate")
                    .value,

            status:
                document
                    .getElementById("editStatus")
                    .value

        };

        try {

            const response =
                await fetch(
                    `${API_URL}/${id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        credentials:
                            "same-origin",

                        body:
                            JSON.stringify(payload)
                    }
                );

            if (!response.ok) {

                if (response.status === 404) {
                    showToast("找不到这个约定");
                    return;
                }

                throw new Error(
                    "修改约定失败"
                );

            }

            showToast("✨ 约定已经修改");

            setTimeout(() => {

                showScreen("screen-list");

                loadPromises();

            }, 500);

        } catch (error) {

            console.error(error);

            showToast("修改约定失败");

        }

    };


// =====================================================
// 删除约定
// =====================================================

async function deletePromise(id) {

    const confirmed =
        confirm(
            "确定要删除这个约定吗？\n\n这个约定删除后将无法恢复。"
        );

    if (!confirmed) {

        return;

    }

    try {

        const response =
            await fetch(
                `${API_URL}/${id}`,
                {
                    method: "DELETE",
                    credentials: "same-origin"
                }
            );

        if (!response.ok) {

            if (response.status === 404) {

                showToast("找不到这个约定");

                return;
            }

            throw new Error(
                "删除失败"
            );

        }

        showToast("🗑️ 约定已经删除");

        await loadPromises();

    } catch (error) {

        console.error(error);

        showToast("删除约定失败");

    }

}


// =====================================================
// 格式化时间
// =====================================================

function formatDateTime(dateString) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleString(
        "zh-CN",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


// =====================================================
// 进入「我的约定」时加载
// =====================================================

document
    .querySelector(
        '[data-target="screen-list"]'
    )
    .onclick = async function () {

        showScreen("screen-list");

        await loadPromises();

    };


// =====================================================
// 页面加载先问一下 /me
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        checkLogin();

    }
);
// =====================================================
// 我的约定对象
// =====================================================

const PARTNER_API = "/api/partners";

let editingPartnerId = null;


// =====================================================
// 对象类型文字
// =====================================================

function getPartnerTypeText(type) {

    const typeMap = {
        USER: "真实用户",
        CHARACTER: "虚拟角色",
        CUSTOM: "自定义对象"
    };

    return typeMap[type] || "其他对象";

}


// =====================================================
// 加载约定对象
// =====================================================

async function loadPartners() {

    const list = document.getElementById("partnerList");
    const count = document.getElementById("partnerCount");

    if (!list || !count) {
        return;
    }

    list.innerHTML = `
        <div class="partner-empty">
            <div class="partner-empty-icon">⏳</div>
            <p>正在加载约定对象...</p>
        </div>
    `;

    try {

        const response = await fetch(PARTNER_API, {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {

            if (response.status === 401) {
                showToast("请先登录");
            } else {
                showToast("获取约定对象失败");
            }

            list.innerHTML = `
                <div class="partner-empty">
                    <p>暂时无法获取约定对象，请稍后重试。</p>
                </div>
            `;

            return;
        }

        const partners = await response.json();

        renderPartners(partners);

    } catch (error) {

        console.error("加载约定对象失败：", error);

        showToast("无法连接服务器");

        list.innerHTML = `
            <div class="partner-empty">
                <p>无法连接服务器，请检查后端是否正常运行。</p>
            </div>
        `;

    }

}


// =====================================================
// 渲染约定对象列表
// =====================================================

function renderPartners(partners) {

    const list = document.getElementById("partnerList");
    const count = document.getElementById("partnerCount");

    count.textContent = `${partners.length} 个对象`;

    list.innerHTML = "";

    if (partners.length === 0) {

        list.innerHTML = `
            <div class="partner-empty">
                <div class="partner-empty-icon">🫙</div>
                <p>还没有约定对象。</p>
                <p>创建一个，开始保存你们之间的故事吧。</p>
            </div>
        `;

        return;
    }

    partners.forEach(partner => {

        const card = document.createElement("div");

        card.className = "partner-card";

        const icon =
            partner.type === "CHARACTER" ? "🌙" : "🌷";

        card.innerHTML = `

            <div class="partner-card-main">

                <div class="partner-avatar">
                    ${icon}
                </div>

                <div class="partner-card-info">

                    <h3>
                        ${escapeHtml(partner.name)}
                    </h3>

                    <span class="partner-type">
                        ${escapeHtml(getPartnerTypeText(partner.type))}
                    </span>

                </div>

            </div>

            <div class="partner-card-actions">

                <button
                    type="button"
                    class="partner-edit-btn"
                    data-action="edit"
                    data-id="${partner.id}">
                    编辑
                </button>

                <button
                    type="button"
                    class="partner-delete-btn"
                    data-action="delete"
                    data-id="${partner.id}">
                    删除
                </button>

            </div>

        `;

        list.appendChild(card);

    });

}


// =====================================================
// 打开创建对象表单
// =====================================================

document
    .getElementById("createPartnerBtn")
    .addEventListener("click", function () {

        editingPartnerId = null;

        document.getElementById("partnerForm").reset();

        document.getElementById("partnerId").value = "";

        document.getElementById("partnerFormTitle").textContent =
            "创建约定对象";

        document.getElementById("savePartnerBtn").textContent =
            "保存对象";

        document.getElementById("partnerType").disabled = false;

        document.getElementById("partnerForm").classList.remove("hidden");

        document.getElementById("partnerName").focus();

    });


// =====================================================
// 取消创建 / 编辑
// =====================================================

document
    .getElementById("cancelPartnerBtn")
    .addEventListener("click", function () {

        editingPartnerId = null;

        document.getElementById("partnerForm").reset();

        document.getElementById("partnerForm").classList.add("hidden");

        document.getElementById("partnerType").disabled = false;

    });


// =====================================================
// 保存约定对象：新增或编辑
// =====================================================

document
    .getElementById("partnerForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();

        const name = document
            .getElementById("partnerName")
            .value
            .trim();

        const type = document
            .getElementById("partnerType")
            .value;

        if (!name) {

            showToast("请输入对象名称");

            return;
        }

        if (name.length > 100) {

            showToast("名称不能超过100个字符");

            return;
        }

        const isEditing = editingPartnerId !== null;

        const url = isEditing
            ? `${PARTNER_API}/${editingPartnerId}`
            : PARTNER_API;

        const method = isEditing ? "PUT" : "POST";

        const payload = isEditing
            ? { name }
            : { name, type };

        const saveButton = document.getElementById("savePartnerBtn");

        saveButton.disabled = true;

        saveButton.textContent = "正在保存...";

        try {

            const response = await fetch(url, {

                method,

                headers: {
                    "Content-Type": "application/json"
                },

                credentials: "same-origin",

                body: JSON.stringify(payload)

            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {

                const message =
                    typeof data === "string"
                        ? data
                        : data.message || "保存约定对象失败";

                showToast(message);

                return;
            }

            showToast(isEditing
                ? "✨ 对象信息已更新"
                : "🌷 已创建约定对象"
            );

            editingPartnerId = null;

            document.getElementById("partnerForm").reset();

            document.getElementById("partnerForm").classList.add("hidden");

            document.getElementById("partnerType").disabled = false;

            await loadPartners();

        } catch (error) {

            console.error("保存约定对象失败：", error);

            showToast("无法连接服务器");

        } finally {

            saveButton.disabled = false;

            saveButton.textContent = isEditing
                ? "保存对象"
                : "保存对象";

        }

    });


// =====================================================
// 对象列表按钮：编辑 / 删除
// =====================================================

document
    .getElementById("partnerList")
    .addEventListener("click", async function (e) {

        const button = e.target.closest("button[data-action]");

        if (!button) {
            return;
        }

        const id = button.dataset.id;

        const action = button.dataset.action;

        if (action === "edit") {

            await editPartner(id);

        } else if (action === "delete") {

            await deletePartner(id);

        }

    });


// =====================================================
// 编辑约定对象
// =====================================================

async function editPartner(id) {

    try {

        const response = await fetch(`${PARTNER_API}/${id}`, {
            method: "GET",
            credentials: "same-origin"
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {

            showToast(data.message || "无法获取对象信息");

            return;
        }

        editingPartnerId = Number(id);

        document.getElementById("partnerId").value = data.id;

        document.getElementById("partnerName").value = data.name || "";

        document.getElementById("partnerType").value = data.type || "CUSTOM";

        document.getElementById("partnerType").disabled = true;

        document.getElementById("partnerFormTitle").textContent =
            "编辑约定对象";

        document.getElementById("savePartnerBtn").textContent =
            "保存修改";

        document.getElementById("partnerForm").classList.remove("hidden");

        document.getElementById("partnerName").focus();

        document.getElementById("partnerForm").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {

        console.error("读取对象信息失败：", error);

        showToast("无法连接服务器");

    }

}


// =====================================================
// 删除约定对象
// =====================================================

async function deletePartner(id) {

    const confirmed = confirm(
        "确定要删除这个约定对象吗？\n\n删除后将无法恢复，请谨慎操作。"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(`${PARTNER_API}/${id}`, {

            method: "DELETE",

            credentials: "same-origin"

        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {

            showToast(data.message || "删除对象失败");

            return;
        }

        if (editingPartnerId === Number(id)) {

            editingPartnerId = null;

            document.getElementById("partnerForm").reset();

            document.getElementById("partnerForm").classList.add("hidden");

            document.getElementById("partnerType").disabled = false;

        }

        showToast("🗑️ 约定对象已删除");

        await loadPartners();

    } catch (error) {

        console.error("删除对象失败：", error);

        showToast("无法连接服务器");

    }

}


// =====================================================
// 进入我的约定对象页面时加载数据
// =====================================================

document
    .getElementById("openPartnersBtn")
    .addEventListener("click", async function () {

        showScreen("screen-partners");

        await loadPartners();

    });
// 加载约定对象到创建约定页面
async function loadPromisePartners() {
    const select = document.getElementById("promisePartner");

    if (!select) {
        return;
    }

    try {
        const response = await fetch("/api/partners", {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("获取约定对象失败");
        }

        const partners = await response.json();

        // 保留默认选项，清除之前加载的对象
        select.innerHTML =
            '<option value="">暂不选择约定对象</option>';

        partners.forEach(partner => {
            const option = document.createElement("option");

            option.value = partner.id;
            option.textContent =
                `${partner.name}${partner.type === "CHARACTER" ? "（角色）" : ""}`;

            select.appendChild(option);
        });

    } catch (error) {
        console.error("加载约定对象失败：", error);

        showToast("约定对象加载失败，请稍后重试");
    }
}
/* =========================
关于约定罐：逐字下落动画
========================= */
function playAboutAnimation() {
    const aboutText = document.getElementById("aboutText");

    if (!aboutText) return;

    // 防止切换页面时丢失原始文字
    if (!aboutText.dataset.originalHtml) {
        aboutText.dataset.originalHtml = aboutText.innerHTML;
    }

    // 恢复原始内容
    aboutText.innerHTML = aboutText.dataset.originalHtml;

    const paragraphs = aboutText.querySelectorAll("p");
    let delay = 0;

    paragraphs.forEach((paragraph) => {
        const text = paragraph.textContent;
        paragraph.textContent = "";

        Array.from(text).forEach((character) => {
            const span = document.createElement("span");

            span.className = "about-char";
            span.textContent = character;
            span.style.animationDelay = `${delay}s`;

            paragraph.appendChild(span);

            // 每个字间隔 45 毫秒
            delay += 0.045;
        });

        // 每段结束后增加一点停顿
        delay += 0.35;
    });

}