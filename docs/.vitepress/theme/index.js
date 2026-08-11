import DefaultTheme from "vitepress/theme";
import { onContentUpdated } from "vitepress";

function initCollapsibleOutline() {
  const root = document.querySelector(".VPDocAsideOutline .VPDocOutlineItem");
  const title = document.querySelector(".VPDocAsideOutline .outline-title");
  if (!root) return;

  // reset: remove previously injected buttons on navigation
  root.querySelectorAll(".outline-toggle").forEach((btn) => btn.remove());
  root.querySelectorAll(".outline-link").forEach((a) => {
    a.style.paddingRight = "";
  });
  document
    .querySelectorAll(".VPDocAsideOutline .VPDocOutlineItem.nested")
    .forEach((ul) => {
      ul.style.display = "";
    });
  document.querySelectorAll(".outline-master-toggle").forEach((b) => b.remove());
  if (title) title.dataset.masterAttached = "";

  const style = document.createElement("style");
  style.id = "outline-toggle-style";
  style.textContent = `
    .VPDocAsideOutline .VPDocOutlineItem > li { position: relative; }
    .VPDocAsideOutline .outline-toggle {
      position: absolute;
      right: 4px;
      top: 0;
      width: 24px;
      height: 32px;
      line-height: 32px;
      text-align: center;
      font-size: 12px;
      color: var(--vp-c-text-3);
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      user-select: none;
      z-index: 2;
      transition: color .25s;
    }
    .VPDocAsideOutline .outline-toggle:hover { color: var(--vp-c-brand-1); }
    .VPDocAsideOutline .outline-link.has-toggle { padding-right: 28px; }
    .VPDocAsideOutline .outline-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .VPDocAsideOutline .outline-master-toggle {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--vp-c-text-3);
      background: transparent;
      border: 1px solid var(--vp-c-divider);
      border-radius: 4px;
      padding: 0 6px;
      height: 20px;
      cursor: pointer;
      user-select: none;
      transition: color .25s, border-color .25s;
      white-space: nowrap;
    }
    .VPDocAsideOutline .outline-master-toggle:hover {
      color: var(--vp-c-brand-1);
      border-color: var(--vp-c-brand-1);
    }
  `;
  if (!document.getElementById("outline-toggle-style")) {
    document.head.appendChild(style);
  }

  // add toggle to every li that contains a nested ul
  const nestedUls = [];
  const toggleBtns = [];
  root.querySelectorAll("li").forEach((li) => {
    const nestedUl = li.querySelector(":scope > ul");
    const link = li.querySelector(":scope > a.outline-link");
    if (!nestedUl || !link) return;

    nestedUls.push(nestedUl);
    link.classList.add("has-toggle");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "outline-toggle";
    btn.textContent = "−";
    btn.title = "展开/收起";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const hidden = nestedUl.style.display === "none";
      nestedUl.style.display = hidden ? "" : "none";
      btn.textContent = hidden ? "−" : "+";
      updateState();
    });
    li.appendChild(btn);
    toggleBtns.push(btn);
  });

  // master toggle: expand/collapse all nested sections
  function updateState() {
    if (!masterBtn) return;
    const allCollapsed = nestedUls.every((ul) => ul.style.display === "none");
    masterBtn.textContent = allCollapsed ? "整体展开" : "整体收起";
    masterBtn.dataset.allCollapsed = allCollapsed ? "1" : "0";
  }

  let masterBtn = null;
  if (title && nestedUls.length && !title.dataset.masterAttached) {
    title.dataset.masterAttached = "true";

    masterBtn = document.createElement("button");
    masterBtn.type = "button";
    masterBtn.className = "outline-master-toggle";
    masterBtn.textContent = "整体收起";
    masterBtn.title = "展开/收起全部子标题";
    masterBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const allCollapsed = masterBtn.dataset.allCollapsed === "1";
      const next = !allCollapsed;
      nestedUls.forEach((ul) => {
        ul.style.display = next ? "none" : "";
      });
      toggleBtns.forEach((btn) => {
        btn.textContent = next ? "+" : "−";
      });
      updateState();
    });
    title.appendChild(masterBtn);
    updateState();
  }
}

onContentUpdated(() => {
  setTimeout(initCollapsibleOutline, 0);
});

export default {
  extends: DefaultTheme,
  enhanceApp() {}
};