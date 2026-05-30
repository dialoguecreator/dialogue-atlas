export interface EmojiEntry {
  emoji: string;
  name: string;
  keywords: string[];
}

// Curated list — covers the most common needs for documentation / agency work.
// Each entry has the unicode name + the words people are most likely to type.
export const EMOJIS: EmojiEntry[] = [
  // Documents & writing
  { emoji: "📄", name: "page facing up", keywords: ["page", "document", "doc", "file", "paper"] },
  { emoji: "📃", name: "page with curl", keywords: ["page", "scroll", "curl", "document"] },
  { emoji: "📝", name: "memo", keywords: ["memo", "note", "pencil", "edit", "write", "writing"] },
  { emoji: "📋", name: "clipboard", keywords: ["clipboard", "list", "checklist", "tasks"] },
  { emoji: "📑", name: "bookmark tabs", keywords: ["bookmark", "tabs", "marker"] },
  { emoji: "🗒️", name: "spiral notepad", keywords: ["notepad", "notes", "notebook"] },
  { emoji: "🗓️", name: "spiral calendar", keywords: ["calendar", "schedule", "planner", "date"] },
  { emoji: "📅", name: "calendar", keywords: ["calendar", "date", "schedule"] },
  { emoji: "📆", name: "tear-off calendar", keywords: ["calendar", "date", "month"] },
  { emoji: "🗂️", name: "card index dividers", keywords: ["divider", "tabs", "index", "organizer"] },
  { emoji: "📁", name: "file folder", keywords: ["folder", "directory", "files"] },
  { emoji: "📂", name: "open file folder", keywords: ["folder", "open", "directory"] },
  { emoji: "🗃️", name: "card file box", keywords: ["box", "files", "archive"] },
  { emoji: "🗄️", name: "file cabinet", keywords: ["cabinet", "archive", "filing", "storage"] },
  { emoji: "📚", name: "books", keywords: ["books", "library", "stack", "education"] },
  { emoji: "📖", name: "open book", keywords: ["book", "open", "reading", "library"] },
  { emoji: "📓", name: "notebook", keywords: ["notebook", "journal", "diary"] },
  { emoji: "📔", name: "notebook with cover", keywords: ["notebook", "journal", "cover"] },
  { emoji: "📕", name: "closed book", keywords: ["book", "closed", "manual"] },
  { emoji: "📗", name: "green book", keywords: ["book", "green"] },
  { emoji: "📘", name: "blue book", keywords: ["book", "blue", "documentation"] },
  { emoji: "📙", name: "orange book", keywords: ["book", "orange"] },
  { emoji: "📰", name: "newspaper", keywords: ["newspaper", "news", "press"] },
  { emoji: "🧾", name: "receipt", keywords: ["receipt", "invoice", "bill"] },

  // Tools & work
  { emoji: "💼", name: "briefcase", keywords: ["briefcase", "business", "work", "office"] },
  { emoji: "🔧", name: "wrench", keywords: ["wrench", "tool", "fix", "spanner", "settings"] },
  { emoji: "🔨", name: "hammer", keywords: ["hammer", "tool", "build"] },
  { emoji: "⚒️", name: "hammer and pick", keywords: ["hammer", "pick", "tools", "craft"] },
  { emoji: "🛠️", name: "hammer and wrench", keywords: ["tools", "hammer", "wrench", "build", "fix", "repair"] },
  { emoji: "⚙️", name: "gear", keywords: ["gear", "settings", "config", "cog", "options"] },
  { emoji: "🧰", name: "toolbox", keywords: ["toolbox", "tools", "kit"] },
  { emoji: "🪛", name: "screwdriver", keywords: ["screwdriver", "tool", "fix"] },
  { emoji: "🔩", name: "nut and bolt", keywords: ["nut", "bolt", "hardware"] },
  { emoji: "⛏️", name: "pick", keywords: ["pick", "mining", "tool"] },
  { emoji: "🪓", name: "axe", keywords: ["axe", "chop", "wood"] },
  { emoji: "🧲", name: "magnet", keywords: ["magnet", "attract"] },

  // Ideas & tech
  { emoji: "💡", name: "light bulb", keywords: ["lightbulb", "idea", "bulb", "innovation"] },
  { emoji: "🧠", name: "brain", keywords: ["brain", "mind", "thinking", "idea"] },
  { emoji: "🚀", name: "rocket", keywords: ["rocket", "launch", "startup", "ship"] },
  { emoji: "🎯", name: "bullseye", keywords: ["target", "goal", "bullseye", "aim", "objective"] },
  { emoji: "🧪", name: "test tube", keywords: ["test", "tube", "experiment", "lab"] },
  { emoji: "🔬", name: "microscope", keywords: ["microscope", "science", "research"] },
  { emoji: "🔭", name: "telescope", keywords: ["telescope", "vision", "future"] },
  { emoji: "📡", name: "satellite antenna", keywords: ["satellite", "antenna", "broadcast"] },
  { emoji: "🖥️", name: "desktop computer", keywords: ["desktop", "computer", "pc"] },
  { emoji: "💻", name: "laptop", keywords: ["laptop", "computer", "macbook"] },
  { emoji: "⌨️", name: "keyboard", keywords: ["keyboard", "typing"] },
  { emoji: "🖱️", name: "computer mouse", keywords: ["mouse", "click"] },
  { emoji: "💾", name: "floppy disk", keywords: ["floppy", "save", "disk"] },
  { emoji: "💿", name: "optical disk", keywords: ["disk", "cd", "media"] },
  { emoji: "📱", name: "mobile phone", keywords: ["phone", "mobile", "iphone", "device"] },
  { emoji: "☎️", name: "telephone", keywords: ["telephone", "phone", "call"] },
  { emoji: "📞", name: "telephone receiver", keywords: ["receiver", "call", "phone"] },

  // Money & business
  { emoji: "💰", name: "money bag", keywords: ["money", "bag", "cash", "wealth"] },
  { emoji: "💵", name: "dollar banknote", keywords: ["dollar", "money", "cash"] },
  { emoji: "💳", name: "credit card", keywords: ["card", "credit", "payment"] },
  { emoji: "🏦", name: "bank", keywords: ["bank", "finance"] },
  { emoji: "📈", name: "chart increasing", keywords: ["chart", "graph", "growth", "increase", "trend"] },
  { emoji: "📉", name: "chart decreasing", keywords: ["chart", "graph", "decrease", "decline"] },
  { emoji: "📊", name: "bar chart", keywords: ["chart", "bar", "analytics", "data", "stats"] },
  { emoji: "🏷️", name: "label", keywords: ["label", "tag", "price"] },
  { emoji: "🏆", name: "trophy", keywords: ["trophy", "winner", "award"] },
  { emoji: "🥇", name: "first place medal", keywords: ["medal", "first", "gold", "winner"] },

  // Communication
  { emoji: "📣", name: "megaphone", keywords: ["megaphone", "announce", "broadcast", "marketing"] },
  { emoji: "📢", name: "loudspeaker", keywords: ["loudspeaker", "announcement", "loud"] },
  { emoji: "💬", name: "speech balloon", keywords: ["speech", "chat", "message", "comment", "dialogue"] },
  { emoji: "🗨️", name: "left speech bubble", keywords: ["speech", "bubble", "talk"] },
  { emoji: "🗯️", name: "right anger bubble", keywords: ["bubble", "anger", "shout"] },
  { emoji: "💭", name: "thought balloon", keywords: ["thought", "think", "idea", "balloon"] },
  { emoji: "📧", name: "email", keywords: ["email", "mail", "message"] },
  { emoji: "📨", name: "incoming envelope", keywords: ["envelope", "mail", "incoming"] },
  { emoji: "📩", name: "envelope with arrow", keywords: ["envelope", "send"] },
  { emoji: "✉️", name: "envelope", keywords: ["envelope", "letter", "mail"] },
  { emoji: "📬", name: "open mailbox with mail", keywords: ["mailbox", "mail"] },

  // Security & locks
  { emoji: "🔒", name: "locked", keywords: ["lock", "locked", "secure", "private"] },
  { emoji: "🔓", name: "unlocked", keywords: ["unlock", "unlocked"] },
  { emoji: "🔐", name: "locked with key", keywords: ["lock", "key", "secure"] },
  { emoji: "🔑", name: "key", keywords: ["key", "access", "password"] },
  { emoji: "🗝️", name: "old key", keywords: ["key", "old", "vintage"] },
  { emoji: "🛡️", name: "shield", keywords: ["shield", "protect", "security", "defense"] },

  // Status / signals
  { emoji: "✅", name: "check mark button", keywords: ["check", "done", "ok", "yes", "complete", "verified"] },
  { emoji: "☑️", name: "check box", keywords: ["check", "tick", "done"] },
  { emoji: "✔️", name: "check mark", keywords: ["check", "tick", "yes"] },
  { emoji: "❌", name: "cross mark", keywords: ["x", "cross", "no", "wrong", "cancel"] },
  { emoji: "⚠️", name: "warning", keywords: ["warning", "alert", "caution"] },
  { emoji: "🚧", name: "construction", keywords: ["construction", "wip", "barrier"] },
  { emoji: "🛑", name: "stop sign", keywords: ["stop", "halt"] },
  { emoji: "🔴", name: "red circle", keywords: ["red", "circle", "stop", "live"] },
  { emoji: "🟠", name: "orange circle", keywords: ["orange", "circle"] },
  { emoji: "🟡", name: "yellow circle", keywords: ["yellow", "circle", "warning"] },
  { emoji: "🟢", name: "green circle", keywords: ["green", "circle", "ok", "go"] },
  { emoji: "🔵", name: "blue circle", keywords: ["blue", "circle"] },
  { emoji: "⭐", name: "star", keywords: ["star", "favorite", "important"] },
  { emoji: "🌟", name: "glowing star", keywords: ["star", "glow", "shine", "favorite"] },
  { emoji: "✨", name: "sparkles", keywords: ["sparkles", "shine", "magic"] },
  { emoji: "🔥", name: "fire", keywords: ["fire", "hot", "trending", "lit"] },
  { emoji: "❤️", name: "red heart", keywords: ["heart", "love", "red"] },
  { emoji: "💯", name: "hundred", keywords: ["100", "hundred", "perfect", "score"] },

  // Search / discovery
  { emoji: "🔍", name: "magnifying glass left", keywords: ["search", "find", "magnify", "look"] },
  { emoji: "🔎", name: "magnifying glass right", keywords: ["search", "find", "magnify"] },

  // People / faces
  { emoji: "😀", name: "grinning face", keywords: ["smile", "happy", "grin"] },
  { emoji: "🙂", name: "slightly smiling face", keywords: ["smile", "slight"] },
  { emoji: "🤔", name: "thinking face", keywords: ["think", "ponder", "hmm"] },
  { emoji: "😎", name: "smiling face with sunglasses", keywords: ["cool", "sunglasses", "shades"] },
  { emoji: "🤩", name: "star-struck", keywords: ["wow", "stars", "amazing"] },
  { emoji: "🥳", name: "partying face", keywords: ["party", "celebrate"] },
  { emoji: "😴", name: "sleeping face", keywords: ["sleep", "tired", "rest"] },
  { emoji: "🤯", name: "exploding head", keywords: ["mind blown", "shocked"] },
  { emoji: "🫶", name: "heart hands", keywords: ["love", "heart", "hands"] },
  { emoji: "👀", name: "eyes", keywords: ["eyes", "look", "see", "watch"] },
  { emoji: "🧑‍💻", name: "technologist", keywords: ["dev", "developer", "coder", "engineer"] },
  { emoji: "🧑‍🎨", name: "artist", keywords: ["artist", "designer", "creative"] },
  { emoji: "🧑‍🏫", name: "teacher", keywords: ["teacher", "instructor"] },
  { emoji: "👨‍💼", name: "man office worker", keywords: ["worker", "office", "businessman"] },
  { emoji: "👩‍💼", name: "woman office worker", keywords: ["worker", "office", "businesswoman"] },

  // Nature
  { emoji: "🌱", name: "seedling", keywords: ["seedling", "plant", "grow", "growth"] },
  { emoji: "🌿", name: "herb", keywords: ["herb", "plant", "leaf"] },
  { emoji: "🍀", name: "four leaf clover", keywords: ["clover", "luck", "lucky"] },
  { emoji: "🌳", name: "deciduous tree", keywords: ["tree", "plant"] },
  { emoji: "🌸", name: "cherry blossom", keywords: ["flower", "blossom", "spring"] },
  { emoji: "🌊", name: "water wave", keywords: ["wave", "water", "ocean"] },
  { emoji: "💧", name: "droplet", keywords: ["drop", "water"] },
  { emoji: "🌙", name: "crescent moon", keywords: ["moon", "night", "dark"] },
  { emoji: "☀️", name: "sun", keywords: ["sun", "sunny", "light", "bright"] },
  { emoji: "⚡", name: "high voltage", keywords: ["lightning", "bolt", "fast", "energy", "zap"] },

  // Misc handy
  { emoji: "🎨", name: "artist palette", keywords: ["art", "design", "palette", "paint", "creative"] },
  { emoji: "🎬", name: "clapper board", keywords: ["movie", "film", "clapper"] },
  { emoji: "🎥", name: "movie camera", keywords: ["camera", "movie", "video"] },
  { emoji: "🎵", name: "musical note", keywords: ["music", "note", "song"] },
  { emoji: "🎶", name: "musical notes", keywords: ["music", "notes", "song"] },
  { emoji: "🎁", name: "gift", keywords: ["gift", "present", "box"] },
  { emoji: "🎉", name: "party popper", keywords: ["party", "celebrate", "confetti"] },
  { emoji: "🛎️", name: "bellhop bell", keywords: ["bell", "service", "ring"] },
  { emoji: "🔔", name: "bell", keywords: ["bell", "notification", "alert", "ring"] },
  { emoji: "🔕", name: "bell with slash", keywords: ["bell", "mute", "silent"] },
  { emoji: "📌", name: "pushpin", keywords: ["pin", "pushpin", "mark"] },
  { emoji: "📍", name: "round pushpin", keywords: ["pin", "location", "place"] },
  { emoji: "🏠", name: "house", keywords: ["house", "home"] },
  { emoji: "🏢", name: "office building", keywords: ["office", "building", "company", "agency"] },
  { emoji: "🌐", name: "globe", keywords: ["globe", "web", "world", "internet"] },
  { emoji: "🗺️", name: "world map", keywords: ["map", "world", "geography"] },
  { emoji: "🧭", name: "compass", keywords: ["compass", "navigate", "direction"] },
  { emoji: "♻️", name: "recycle", keywords: ["recycle", "sustainability", "loop"] },
  { emoji: "🗑️", name: "wastebasket", keywords: ["trash", "bin", "delete", "wastebasket"] },
  { emoji: "🔗", name: "link", keywords: ["link", "chain", "url"] },
  { emoji: "📎", name: "paperclip", keywords: ["paperclip", "attach", "attachment"] },
  { emoji: "✂️", name: "scissors", keywords: ["scissors", "cut"] },
  { emoji: "🖊️", name: "pen", keywords: ["pen", "write"] },
  { emoji: "🖋️", name: "fountain pen", keywords: ["pen", "fountain", "write"] },
  { emoji: "🖌️", name: "paintbrush", keywords: ["brush", "paint"] },
  { emoji: "🖍️", name: "crayon", keywords: ["crayon", "color"] },
  { emoji: "📐", name: "triangular ruler", keywords: ["ruler", "triangle", "measure"] },
  { emoji: "📏", name: "straight ruler", keywords: ["ruler", "measure"] },
  { emoji: "🧮", name: "abacus", keywords: ["abacus", "math", "count"] },

  // Food (a few, for fun)
  { emoji: "☕", name: "hot beverage", keywords: ["coffee", "tea", "hot", "drink"] },
  { emoji: "🍵", name: "teacup", keywords: ["tea", "matcha", "drink"] },
  { emoji: "🥤", name: "cup with straw", keywords: ["drink", "soda", "straw"] },
  { emoji: "🍕", name: "pizza", keywords: ["pizza", "food"] },
];

export function searchEmojis(query: string, limit = 60): EmojiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: { entry: EmojiEntry; score: number }[] = [];
  for (const entry of EMOJIS) {
    let score = 0;
    if (entry.name === q) score = 100;
    else if (entry.name.startsWith(q)) score = 80;
    else if (entry.name.includes(q)) score = 60;
    for (const kw of entry.keywords) {
      if (kw === q) score = Math.max(score, 90);
      else if (kw.startsWith(q)) score = Math.max(score, 70);
      else if (kw.includes(q)) score = Math.max(score, 50);
    }
    if (score > 0) results.push({ entry, score });
  }
  results.sort((a, b) => b.score - a.score || a.entry.name.length - b.entry.name.length);
  return results.slice(0, limit).map((r) => r.entry);
}
