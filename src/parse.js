/* jshint globalstrict: true */
'use strict';

function parse(expr) {
    return new Parser(new Lexer()).parse(expr);
}

var ESCAPES = {
    'n': '\n',
    'f': '\f',
    'r': '\r',
    't': '\t',
    'v': '\v',
    '\'': '\'',
    '"': '\"'
};

var CONSTANTS = {
    'null': _.constant(null),
    'true': _.constant(true),
    'false': _.constant(false)
};

_.forEach(CONSTANTS, function (fn, constantName) {
    fn.constant = fn.literal = true;
});

function Lexer() {
}

Lexer.prototype.lex = function (text) {
    this.text = text;
    this.index = 0;
    this.ch = undefined;
    this.tokens = [];

    while (this.index < this.text.length) {
        this.ch = this.text.charAt(this.index);
        if (this.isNumber(this.ch) ||
            (this.is('.') && this.isNumber(this.peek()))) {
            this.readNumber();
        } else if (this.is('\'"')) {
            this.readString(this.ch);
        } else if (this.is("[],{}:")) {
            this.tokens.push({
                text: this.ch
            });
            this.index++;
        } else if (this.isIdent(this.ch)) {
            this.readIdent();
        } else if (this.isWhitespace(this.ch)) {
            this.index++;
        } else {
            throw 'Unexpected next character: ' + this.ch;
        }
    }

    return this.tokens;
};

Lexer.prototype.is = function (chs) {
    return chs.indexOf(this.ch) >= 0;
};

Lexer.prototype.isNumber = function (ch) {
    return '0' <= ch && ch <= '9';
};

Lexer.prototype.peek = function () {
    return this.index < this.text.length - 1 ?
        this.text.charAt(this.index + 1) :
        false;
};

Lexer.prototype.readNumber = function () {
    var number = '';
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index).toLowerCase();
        if (ch === '.' || this.isNumber(ch)) {
            number += ch;
        } else {
            var nextCh = this.peek();
            var prevCh = number.charAt(number.length - 1);
            if (ch === 'e' && this.isExpOperator(nextCh)) {
                number += ch;
            } else if (this.isExpOperator(ch) && prevCh === 'e' &&
                nextCh && this.isNumber(nextCh)) {
                number += ch;
            } else if (this.isExpOperator(ch) && prevCh === 'e' &&
                (!nextCh || !this.isNumber(nextCh))) {
                throw 'Invalid exponent';
            } else {
                break;
            }
        }
        this.index++;
    }
    number = 1 * number;
    this.tokens.push({
        text: number,
        fn: _.constant(number),
        constant: true
    });
};

Lexer.prototype.readString = function (quote) {
    this.index++;
    var rawString = quote;
    var string = '';
    var escape = false;
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index);
        rawString += ch;
        if (escape) {
            if (ch === 'u') {
                var hex = this.text.substring(this.index + 1, this.index + 5);
                if (!hex.match(/[\da-f]{4}/i)) {
                    throw 'Invalid unicode escape';
                }
                rawString += hex;
                this.index += 4;
                string += String.fromCharCode(parseInt(hex, 16));
            } else {
                var replacement = ESCAPES[ch];
                if (replacement) {
                    string += replacement;
                } else {
                    string += ch;
                }
            }
            escape = false;
        } else if (ch === quote) {
            this.index++;
            this.tokens.push({
                string: string,
                text: rawString,
                constant: true,
                fn: _.constant(string)
            });
            return;
        } else if (ch === '\\') {
            escape = true;
        } else {
            string += ch;
        }
        this.index++;
    }
    throw 'Unmatched quote';
};


Lexer.prototype.readIdent = function () {
    var text = '';
    while (this.index < this.text.length) {
        var ch = this.text.charAt(this.index);
        if (ch === '.' || this.isIdent(ch) || this.isNumber(ch)) {
            text += ch;
        } else {
            break;
        }
        this.index++;
    }
    var token = {
        text: text,
        fn: CONSTANTS[text] || getterFn(text)
    };
    this.tokens.push(token);
};

var getterFn = _.memoize(function (ident) {
    var pathKeys = ident.split(".");
    if (pathKeys.length === 1) {
        return simpleGetterFn1(pathKeys[0]);
    } else if (pathKeys.length === 2) {
        return simpleGetterFn2(pathKeys[0], pathKeys[1]);
    } else {
        return generatedGetterFunction(pathKeys);
    }
});

var simpleGetterFn1 = function (key) {
    return function (scope, locals) {
        if (!scope) {
            return undefined;
        }
        return (locals && locals.hasOwnProperty(key)) ? locals[key] : scope[key];
    };
};
var simpleGetterFn2 = function (key1, key2) {
    return function (scope, locals) {
        if (!scope) {
            return undefined;
        }
        scope = (locals && locals.hasOwnProperty(key1)) ?
            locals[key1] :
            scope[key1];
        return scope ? scope[key2] : undefined;
    };
};
var generatedGetterFunction = function (keys) {
    var code = '';
    _.forEach(keys, function (key, idx) {
        code += 'if (!scope) { return undefined; } \n';
        if (idx === 0) {
            code += 'scope = (locals && locals.hasOwnProperty("' + key + '")) ?' +
            'locals["' + key + '"] : ' +
            'scope["' + key + '"]; \n';
        } else {
            code += 'scope = scope["' + key + '"]; \n';
        }
    });
    code += 'return scope;\n';
    /* jshint -W054 */
    return new Function('scope', 'locals', code);
    /* jshint +W054 */
};

Lexer.prototype.isExpOperator = function (ch) {
    return ch === '-' || ch === '+' || this.isNumber(ch);
};

Lexer.prototype.isIdent = function (ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
        ch === '_' || ch === '$';
};

Lexer.prototype.isWhitespace = function (ch) {
    return ch === ' ' || ch === '\r' || ch === '\t' ||
        ch === '\n' || ch === '\v' || ch === '\u00A0';
};

function Parser(lexer) {
    this.lexer = lexer;
}

Parser.prototype.parse = function (text) {
    this.tokens = this.lexer.lex(text);
    return this.primary();
};

Parser.prototype.primary = function () {
    var primary;
    if (this.expect('[')) {
        primary = this.arrayDeclaration();
    } else if (this.expect('{')) {
        primary = this.object();
    } else {
        var token = this.expect();
        primary = token.fn;
        if (token.constant) {
            primary.constant = true;
            primary.literal = true;
        }
    }
    return primary;
};

Parser.prototype.expect = function (e) {
    var token = this.peek(e);
    if (token) {
        return this.tokens.shift();
    }
};

Parser.prototype.arrayDeclaration = function () {
    var elementFns = [];
    if (!this.peek(']')) {
        do {
            if (this.peek(']')) {
                break;
            }
            elementFns.push(this.primary());
        } while (this.expect(','));
    }
    this.consume(']');
    var arrayFn = function () {
        return _.map(elementFns, function (elementFn) {
            return elementFn();
        });
    };
    arrayFn.literal = true;
    arrayFn.constant = true;
    return arrayFn;
};

Parser.prototype.consume = function (e) {
    if (!this.expect(e)) {
        throw 'Unexpected. Expecting ' + e;
    }
};

Parser.prototype.peek = function (e) {
    if (this.tokens.length > 0) {
        var text = this.tokens[0].text;
        if (text === e || !e) {
            return this.tokens[0];
        }
    }
};

Parser.prototype.object = function () {
    var keyValues = [];
    if (!this.peek('}')) {
        do {
            var keyToken = this.expect();
            this.consume(':');
            var valueExpression = this.primary();
            keyValues.push({
                key: keyToken.string || keyToken.text,
                value: valueExpression
            });
        } while (this.expect(','));
    }

    this.consume('}');
    var objectFn = function () {
        var object = {};
        _.forEach(keyValues, function (kv) {
            object[kv.key] = kv.value();
        });
        return object;
    };
    objectFn.literal = true;
    objectFn.constant = true;
    return objectFn;
};
