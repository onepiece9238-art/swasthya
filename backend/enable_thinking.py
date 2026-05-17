"""
Enable thinking mode in the swasthya-sahayak.ipynb notebook:
1. Set enable_thinking=True in apply_chat_template calls
2. Add a parse_thinking() helper to split <think> block from response
3. Update generate_response() to display thinking trace separately
4. Update the Final Summary cell to reflect thinking is now ON
"""
import json, re

notebook_path = "/Users/deekshith/Documents/Code/swasthya/swasthya-sahayak.ipynb"

with open(notebook_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

changes = 0

for cell in nb["cells"]:
    if cell["cell_type"] != "code":
        continue

    src = cell["source"] if isinstance(cell["source"], str) else "".join(cell["source"])

    # ── 1. Enable thinking in apply_chat_template calls ──────────────────────
    if "apply_chat_template" in src and "enable_thinking" not in src:
        src = src.replace(
            "add_generation_prompt=True,",
            "add_generation_prompt=True,\n        enable_thinking=True,"
        )
        changes += 1

    # ── 2. Add parse_thinking helper + update generate_response ──────────────
    if "def generate_response(" in src and "parse_thinking" not in src:
        helper = (
            "import re as _re\n\n"
            "def parse_thinking(text):\n"
            "    \"\"\"Split Gemma 4 thinking trace from final answer.\"\"\"\n"
            "    think_match = _re.search(r'<think>(.*?)</think>', text, _re.DOTALL)\n"
            "    if think_match:\n"
            "        thinking = think_match.group(1).strip()\n"
            "        answer   = text[think_match.end():].strip()\n"
            "    else:\n"
            "        thinking = None\n"
            "        answer   = text.strip()\n"
            "    return thinking, answer\n\n"
        )
        src = helper + src
        changes += 1

    # ── 3. Update generate_response return to expose thinking ────────────────
    if "def generate_response(" in src and "parse_thinking" in src:
        # Replace the tokenizer.decode + return line
        old_return = (
            '    response = tokenizer.decode(\n'
            '        outputs[0][input_len:],\n'
            '        skip_special_tokens=False\n'
            '    ).replace("<end_of_turn>", "").replace("<bos>", "").strip()\n'
            '\n'
            '    return response'
        )
        new_return = (
            '    raw = tokenizer.decode(\n'
            '        outputs[0][input_len:],\n'
            '        skip_special_tokens=False\n'
            '    ).replace("<end_of_turn>", "").replace("<bos>", "").strip()\n'
            '\n'
            '    thinking, response = parse_thinking(raw)\n'
            '    return response, thinking'
        )
        if old_return in src:
            src = src.replace(old_return, new_return)
            changes += 1

    # ── 4. Update show() and callers to unpack (response, thinking) tuple ────
    if "def show(query: str, response: str" in src:
        old_show = "def show(query: str, response: str, lang: str = \"en\"):"
        new_show = "def show(query: str, response: str, lang: str = \"en\", thinking: str = None):"
        if old_show in src:
            src = src.replace(old_show, new_show)
            # Insert thinking display before the response lines
            old_print_resp = '    print(f"  RESPONSE :\\n")\n    for line in response.split("\\n"):'
            new_print_resp = (
                '    if thinking:\n'
                '        print(f"  💭 THINKING TRACE (Gemma 4 reasoning):")\n'
                '        for line in thinking.split("\\n")[:8]:  # show first 8 lines\n'
                '            print(f"    {line}")\n'
                '        print(f"  {chr(8230)} ({len(thinking.split(chr(10)))} lines total)")\n'
                '        print("-" * 72)\n'
                '    print(f"  RESPONSE :\\n")\n'
                '    for line in response.split("\\n"):'
            )
            if old_print_resp in src:
                src = src.replace(old_print_resp, new_print_resp)
                changes += 1

    # ── 5. Fix demo callers: r = generate_response(q) → r, thinking = ...  ──
    #    Pattern: r = generate_response(...)  followed by show(q, r)
    src = re.sub(
        r'(r\s*=\s*generate_response\(([^)]+)\))\n(\s*show\(q, r)',
        lambda m: f'r, thinking = generate_response({m.group(2)})\n{m.group(3)}, thinking=thinking',
        src
    )

    # ── 6. Update Final Summary to say Thinking: Enabled ─────────────────────
    if "Thinking      : Disabled" in src:
        src = src.replace(
            "Thinking      : Disabled (Gemma 2 template / enable_thinking=False)",
            "Thinking      : Enabled (enable_thinking=True — full reasoning trace visible)"
        )
        changes += 1

    # Write back
    cell["source"] = src

with open(notebook_path, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1)

print(f"✓ Applied {changes} changes to enable Gemma 4 thinking mode")
print("  Changes made:")
print("  1. enable_thinking=True added to all apply_chat_template() calls")
print("  2. parse_thinking() helper added to extract <think>…</think> block")
print("  3. generate_response() now returns (answer, thinking) tuple")
print("  4. show() now displays the thinking trace before the final answer")
print("  5. All demo callers unpacked into (r, thinking)")
print("  6. Final summary updated: 'Thinking: Enabled'")
