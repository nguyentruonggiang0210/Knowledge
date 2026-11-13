(() => {
  const pages = [
    ["index.html", "Tổng quan"],
    ["01-foundations.html", "Nền tảng"],
    ["02-retrieval-rag.html", "RAG"],
    ["03-agent-orchestration.html", "Agents"],
    ["04-bmad-delivery.html", "BMAD"],
    ["05-governance-evals.html", "Governance"],
    ["06-end-to-end.html", "End-to-end"],
    ["07-hands-on-labs.html", "Labs"],
    ["techniques.html", "Atlas"]
  ];

  const current = location.pathname.split("/").pop() || "index.html";
  const nav = document.querySelector("[data-nav]");
  if (nav) {
    nav.innerHTML = pages.map(([href, label]) =>
      `<a href="${href}" ${href === current ? 'aria-current="page"' : ""}>${label}</a>`
    ).join("");
  }

  const toggle = document.querySelector("[data-nav-toggle]");
  toggle?.addEventListener("click", () => {
    const open = nav?.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(Boolean(open)));
  });

  document.querySelectorAll("pre").forEach((pre) => {
    const button = document.createElement("button");
    button.className = "copy-code";
    button.type = "button";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      const code = pre.querySelector("code")?.textContent || pre.textContent || "";
      await navigator.clipboard.writeText(code.replace("Copy", ""));
      button.textContent = "Đã copy";
      setTimeout(() => button.textContent = "Copy", 1200);
    });
    pre.appendChild(button);
  });

  const lessonPages = pages.filter(([href]) => /^0[1-7]-/.test(href));
  const completed = new Set(JSON.parse(localStorage.getItem("kb-lessons-completed") || "[]"));
  const saveProgress = () => localStorage.setItem("kb-lessons-completed", JSON.stringify([...completed]));
  const renderProgress = () => {
    document.querySelectorAll("[data-progress-fill]").forEach((el) => {
      el.style.width = `${Math.round(completed.size / lessonPages.length * 100)}%`;
    });
    document.querySelectorAll("[data-progress-text]").forEach((el) => {
      el.textContent = `${completed.size}/${lessonPages.length} bài đã hoàn thành`;
    });
    document.querySelectorAll("[data-lesson-link]").forEach((el) => {
      if (completed.has(el.getAttribute("data-lesson-link"))) el.classList.add("is-complete");
    });
  };
  const completeButton = document.querySelector("[data-complete-lesson]");
  if (completeButton && /^0[1-7]-/.test(current)) {
    completeButton.dataset.complete = String(completed.has(current));
    completeButton.textContent = completed.has(current) ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành";
    completeButton.addEventListener("click", () => {
      if (completed.has(current)) completed.delete(current); else completed.add(current);
      saveProgress();
      completeButton.dataset.complete = String(completed.has(current));
      completeButton.textContent = completed.has(current) ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành";
      renderProgress();
    });
  }
  renderProgress();

  const atlas = document.querySelector("[data-technique-atlas]");
  if (atlas && Array.isArray(window.KB_TECHNIQUES)) {
    const search = document.querySelector("[data-technique-search]");
    const category = document.querySelector("[data-technique-category]");
    const maturity = document.querySelector("[data-technique-maturity]");
    const count = document.querySelector("[data-technique-count]");
    const categoryNames = {
      knowledge: "Knowledge architecture",
      retrieval: "Retrieval & grounding",
      agents: "Multi-agent & skills",
      evaluation: "Evaluation",
      security: "Security & governance"
    };
    const maturityClass = (value) => value.startsWith("Experimental") ? "red" : value.startsWith("Blueprint") ? "amber" : "";
    const render = () => {
      const query = (search?.value || "").trim().toLocaleLowerCase("vi");
      const selectedCategory = category?.value || "all";
      const selectedMaturity = maturity?.value || "all";
      const matches = window.KB_TECHNIQUES.filter((item) => {
        const haystack = `${item.name} ${item.use_case} ${item.flow} ${item.source}`.toLocaleLowerCase("vi");
        const maturityGroup = item.maturity.startsWith("Implemented") ? "implemented" : item.maturity.startsWith("Blueprint") ? "blueprint" : "experimental";
        return (!query || haystack.includes(query)) &&
          (selectedCategory === "all" || item.category === selectedCategory) &&
          (selectedMaturity === "all" || maturityGroup === selectedMaturity);
      });
      count.textContent = `${matches.length}/${window.KB_TECHNIQUES.length} kỹ thuật`;
      atlas.innerHTML = matches.length ? matches.map((item) => `
        <article class="technique-card" id="${item.id}">
          <div class="atlas-meta">
            <span class="pill blue">${categoryNames[item.category]}</span>
            <span class="pill ${maturityClass(item.maturity)}">${item.maturity}</span>
          </div>
          <h3>${item.name}</h3>
          <dl>
            <dt>Dùng để làm gì?</dt><dd>${item.use_case}</dd>
            <dt>Flow thực tế</dt><dd class="flow-mini">${item.flow}</dd>
            <dt>Trade-off</dt><dd>${item.tradeoff}</dd>
            <dt>Nằm ở đâu?</dt><dd class="source-note">${item.source}</dd>
          </dl>
        </article>`).join("") : '<div class="empty-state">Không có kỹ thuật khớp bộ lọc.</div>';
    };
    [search, category, maturity].forEach((control) => control?.addEventListener("input", render));
    render();
  }

  document.querySelectorAll("[data-build-date]").forEach((el) => {
    if (window.KB_LESSON_BUILD) el.textContent = window.KB_LESSON_BUILD;
  });
})();
