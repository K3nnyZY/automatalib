import type { SyntaxTreeNode } from "@/types/automata";

export class RegExp {
  /**
   * The regular expression
   */
  public expression: string;
  /**
   * The syntax tree of the regular expression
   */
  public syntax_tree: SyntaxTreeNode;
  /**
   * The symbols of the regular expression
   */
  public symbols: string[];
  /*
   * Empty symbol to be used on the regexp
   */
  protected empty_symbol: string;

  constructor(expression: string, empty_symbol: string) {
    this.empty_symbol = empty_symbol;
    this.expression = expression;
    this.syntax_tree = this.parse();
    this.symbols = this.extractSymbols();
  }

  /**
   * Parse a regular expression into a syntax tree.
   *
   * Originally from:
   * https://github.com/CyberZHG/toolbox/blob/gh-pages/js/lexical.js
   *
   * This function was modified for this project.
   @returns The syntax tree of the regular expression
   */
  protected parse(): SyntaxTreeNode {
    const emptySymbol = this.empty_symbol;

    const parseSub = (
      text: string,
      begin: number,
      end: number,
      first: boolean,
    ): SyntaxTreeNode => {
      let last = 0;
      let stack = 0;
      const node: SyntaxTreeNode = { begin, end };
      const parts: SyntaxTreeNode[] = [];
      let lastOperator: string | null = null;

      if (text.length === 0) {
        throw new Error("Empty input");
      }

      if (first) {
        for (let i = 0; i <= text.length; i++) {
          if (i === text.length || (text[i] === "|" && stack === 0)) {
            if (last === 0 && i === text.length) {
              return parseSub(text, begin + last, begin + i, false);
            }

            const sub = parseSub(text.substring(last, i), begin + last, begin + i, true);
            parts.push(sub);
            last = i + 1;
          } else if (text[i] === "(") {
            stack++;
          } else if (text[i] === ")") {
            stack--;
            if (stack < 0) {
              throw new Error(`Unmatched closing parenthesis at position ${i}.`);
            }
          }
        }

        if (parts.length === 1) return parts[0];

        node.type = "or";
        node.parts = parts;
      } else {
        for (let i = 0; i < text.length; i++) {
          if (text[i] === "(") {
            last = i + 1;
            i++;
            stack = 1;

            while (i < text.length && stack !== 0) {
              if (text[i] === "(") stack++;
              else if (text[i] === ")") stack--;
              i++;
            }

            if (stack !== 0) {
              throw new Error(`Missing right bracket for ${begin + last}.`);
            }

            i--;
            const sub = parseSub(text.substring(last, i), begin + last, begin + i, true);
            sub.begin--;
            sub.end++;

            parts.push(sub);
            lastOperator = null;
          } else if (text[i] === "*" || text[i] === "+" || text[i] === "?") {
            if (parts.length === 0) {
              throw new Error(`Unexpected ${text[i]} at ${begin + i}.`);
            }

            const lastPart = parts[parts.length - 1];

            if (lastOperator !== null) {
              if (lastOperator === "?" && text[i] === "?") {
                throw new Error(`Invalid '?' after '?' at ${begin + i}.`);
              }
              if (
                (text[i] === "*" || text[i] === "+") &&
                (lastOperator === "*" || lastOperator === "+" || lastOperator === "?")
              ) {
                throw new Error(`Invalid '${text[i]}' after '${lastOperator}' at ${begin + i}.`);
              }
            }

            const tempNode: SyntaxTreeNode = {
              begin: lastPart.begin,
              end: lastPart.end + 1,
              sub: lastPart,
            };

            if (text[i] === "*") tempNode.type = "star";
            else if (text[i] === "+") tempNode.type = "plus";
            else tempNode.type = "optional";

            parts[parts.length - 1] = tempNode;
            lastOperator = text[i];
          } else if (text[i] === emptySymbol) {
            parts.push({ begin: begin + i, end: begin + i + 1, type: "empty" });
            lastOperator = null;
          } else {
            parts.push({ begin: begin + i, end: begin + i + 1, type: "text", text: text[i] });
            lastOperator = null;
          }
        }

        if (parts.length === 1) return parts[0];

        node.type = "cat";
        node.parts = parts;
      }

      if (stack > 0) {
        throw new Error(`Unmatched opening parenthesis at position ${end}.`);
      }

      return node;
    };

    return parseSub(this.expression, 0, this.expression.length, true);
  }

  /**
   * Extracts all unique symbols from the regex string.
   * @returns An array of unique symbols.
   */
  protected extractSymbols(): string[] {
    const ignoreChars = ["(", ")", "|", "*", "+", "?", this.empty_symbol];

    //Set to store unique symbols
    const symbolsSet = new Set<string>();

    // Iterate through each character in the regex string
    for (const char of this.expression) {
      // Check if the character is not in the ignore list
      if (!ignoreChars.includes(char)) {
        symbolsSet.add(char);
      }
    }

    // Convert the Set to an array and return it
    return Array.from(symbolsSet);
  }
}
