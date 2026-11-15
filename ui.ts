/**
 * Page chrome shared by every scene: glass segmented choices and the chat composer.
 */
/** A greeting by the local time, with an optional display name. */
export function greetingFor(name = "", date = new Date()) {
  const hour = date.getHours();
  const time = hour >= 5 && hour < 12 ? "Good morning"
    : hour >= 12 && hour < 17 ? "Good afternoon"
    : hour >= 17 && hour < 22 ? "Good evening"
    : "Still up";
  return time + (name ? `, ${name}` : "") + (time === "Still up" ? "?" : "");
}

/** Greet by local time and remember the name entered on this device. */
export function mountGreeting(storageKey: string) {
  const greeting = document.querySelector<HTMLElement>(".greeting")!;
  const edit = document.querySelector<HTMLButtonElement>(".greeting-edit")!;
  const dialog = document.querySelector<HTMLDialogElement>(".name-dialog")!;
  const form = dialog.querySelector("form")!;
  const input = form.querySelector("input")!;
  const cleanName = (value: string) => value.trim().slice(0, input.maxLength);
  let name = "";
  try {
    name = cleanName(localStorage.getItem(storageKey) ?? "");
  } catch {
    // The name can still be edited for this visit.
  }

  const update = () => {
    greeting.textContent = greetingFor(name);
    edit.textContent = name ? "Edit name" : "Set name";
  };

  edit.addEventListener("click", () => {
    input.value = name;
    dialog.showModal();
    input.select();
  });

  form.querySelector<HTMLButtonElement>("[data-cancel]")!.addEventListener("click", () => dialog.close());
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    name = cleanName(input.value);
    try {
      if (name) localStorage.setItem(storageKey, name);
      else localStorage.removeItem(storageKey);
    } catch {
      // Keep the current name in memory when storage is unavailable.
    }
    update();
    dialog.close();
  });

  update();
  setInterval(update, 60_000);
}

/** UI only: a submit fires a `chat:submit` event on the form for whatever backend gets wired up. */
export function mountComposer() {
  const form = document.querySelector<HTMLFormElement>(".composer")!;
  const prompt = form.querySelector("textarea")!;
  const send = form.querySelector<HTMLButtonElement>(".send")!;

  function fit() {
    prompt.style.height = "auto";
    prompt.style.height = `${prompt.scrollHeight}px`;
    // Scroll only once it hits its max height; below that it just grows.
    prompt.style.overflowY = prompt.scrollHeight > prompt.clientHeight + 1 ? "auto" : "hidden";
    send.disabled = prompt.value.trim() === "";
  }

  prompt.addEventListener("input", fit);
  // Ready to type on load where there's a mouse; on a phone that would throw the keyboard up.
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) prompt.focus({ preventScroll: true });
  prompt.addEventListener("keydown", (e) => {
    // Enter sends, Shift+Enter is a newline; leave Enter alone mid-IME composition.
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = prompt.value.trim();
    if (!text) return;
    form.dispatchEvent(new CustomEvent("chat:submit", { detail: { text } }));
    prompt.value = "";
    fit();
  });
}

export interface Choice {
  value: string;
  label: string;
  /** CSS colour for a dot before the label; none if left out. */
  swatch?: string;
}

/**
 * A glass segmented control in `host` (a radiogroup): every choice in a row, with a thumb that slides
 * under the current one. Arrow keys move between them; the row scrolls sideways if it doesn't fit.
 */
export function mountChoices(host: HTMLElement, choices: Choice[], current: string, onPick: (value: string) => void) {
  const thumb = document.createElement("span");
  thumb.className = "thumb";
  thumb.setAttribute("aria-hidden", "true");
  host.append(thumb);

  const buttons = choices.map((c) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("role", "radio");
    b.dataset.value = c.value;
    const dot = c.swatch ? `<span class="dot" style="--swatch: ${c.swatch}" aria-hidden="true"></span>` : "";
    b.innerHTML = `${dot}<span>${c.label}</span>`;
    b.addEventListener("click", () => select(c.value, true));
    host.append(b);
    return b;
  });

  function place() {
    const b = buttons.find((x) => x.getAttribute("aria-checked") === "true");
    if (!b) return;
    thumb.style.translate = `${b.offsetLeft}px 0`;
    thumb.style.width = `${b.offsetWidth}px`;
  }

  function select(value: string, pick: boolean) {
    for (const b of buttons) {
      const on = b.dataset.value === value;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on) b.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    place();
    if (pick) onPick(value);
  }

  host.addEventListener("keydown", (e) => {
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0 || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    const next = buttons[(at + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length];
    next.focus();
    select(next.dataset.value!, true);
  });

  select(current, false);
  // Labels change width once the webfont arrives, and when the window resizes.
  document.fonts?.ready.then(place);
  window.addEventListener("resize", place);
}
