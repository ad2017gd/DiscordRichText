/**
 * @name DiscordRichText
 * @version 0.0.1
 * @author ad2017
 * @authorId 288314320033546241
 * @authorLink https://ad2017.dev
 * @description Add more text customization abilities to
 * Discord, seamless to vanilla users.
 * @website https://ad2017.dev
 * @donate https://paypal.me/ad2k17
 * @updateUrl https://github.com/ad2017gd/DiscordRichText/raw/main/DiscordRichText.plugin.js
 */



const b16map = "\u2060\u2061\u2062\u2063\u2064\u2065\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F\u200B\u200C";
const strsep = "\uFEFF";

function num_base16e(a) {
    return a.toString(16).split("").map(x => b16map[parseInt(x, 16)]).join("");
}
function num_base16d(a) {
    return parseInt(a.split("").map(x => b16map.indexOf(x).toString(16)).join(""), 16);
}


function ascii_base16e(a) {
    return a.split("").map(x => x.charCodeAt() > 16 ? num_base16e(x.charCodeAt()) : (b16map[0] + num_base16e(x.charCodeAt()))).join("");
}
function ascii_base16d(a) {
    return a.match(/.{1,2}/g).map(x => num_base16d(x)).map(x => String.fromCharCode(x)).join("");
}

function utf8_base16e(a) {
    return a.split("").map(x => b16map[0].repeat(4 - x.charCodeAt().toString(16).length) + num_base16e(x.charCodeAt())).join("");
}
function utf8_base16d(a) {
    return a.match(/.{1,4}/gu).map(x => num_base16d(x)).map(x => String.fromCharCode(x)).join("");
}




const Formats = {
    "Color": 0x00, // Text foreground color
    "Highlight": 0x01, // Text background color
    "Style": 0x02, // Text styles such as Bold, Underline etc. (and maybe other custom styles)
    "Size": 0x03, // Font size

    "Reset": 0x1F, // Reset text style(s)

    "Image": 0x20, // Display image

    "Formatted": 0xFE, // Formatted message mark
    "Invalid": 0xFF
}

const BitFlags = {
    "Style": {
        "Blink": 0b0000000000000001,
        "Marquee": 0b0000000000000010,
        "Center": 0b0000000000000100,

        "Disable": 0b1000000000000000
    },
    "Reset": {
        "All": 0b0000000000000000, // Not a bit flag, just for reference.

        "Color": 0b0000000000000001,
        "Highlight": 0b0000000000000010,
        "Style": 0b0000000000000100,
        "Size": 0b0000000000001000
    }
}

function makeStyle(format, options) {
    let style = format;
    let extended = strsep;

    switch (format) {
        case Formats.Color: {
            style |= options.color << 8;
            break;
        }
        case Formats.Highlight: {
            style |= options.color << 8;
            break;
        }
        case Formats.Style: {
            let modify = 0;
            for (s in options.style) {
                modify |= BitFlags.Style[options.style[s]];
            }
            options.disable ? modify |= BitFlags.Style.Disable : 0;
            modify = modify << 8;

            style |= modify;
            break;
        }
        case Formats.Size: {
            style |= options.size << 8;
            break;
        }
        case Formats.Reset: {
            let modify = 0;
            for (s in options.style) {
                modify |= BitFlags.Reset[options.style[s]];
            }
            modify = modify << 8;

            style |= modify;
            break;
        }
        case Formats.Image: {
            options.width > 0xFFF ? options.width = 0xFFF : 0;
            options.height > 0xFFF ? options.height = 0xFFF : 0;

            extended += strsep + ascii_base16e(options.src) + strsep + "\u2060";

            style |= ((options.width << 12) + options.height) << 8;
            break;
        }
        case Formats.Formatted: {
            break;
        }
        default: {
            style = Formats.Invalid;
        }
    }

    return num_base16e(style >>> 0) + extended; // unsigned
}

function parseToRichText(x) {
    if(!x.startsWith("[formatted]")) return x;
    let regex = /(?<!(?<!\\)\\)(?:(?:\[(\/?[^\[\]]+)(?!\\)\]))/g;
    let styles = [];
    let command = x.replace(regex, (match, p, off, str) => {
        let argument = p.match(/("[^"]+"|[^\s"]+)/g);
        let cmd = argument[0].startsWith("/") ? argument[0].substring(1) : argument[0];
        let p1 = argument[0].startsWith("/") ? true : false;

        switch (cmd) {
            case "formatted": {
                return makeStyle(Formats.Formatted, {});
            }
            case "h1": {
                if (!p1) {
                    return makeStyle(Formats.Size, { size: 48 });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Size"] });
                }
                break;
            }
            case "h2": {
                if (!p1) {
                    return makeStyle(Formats.Size, { size: 38 });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Size"] });
                }
                break;
            }
            case "h3": {
                if (p1 != undefined) {
                    return makeStyle(Formats.Size, { size: 26 });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Size"] });
                }
                break;
            }
            case "h4": {
                if (!p1) {
                    return makeStyle(Formats.Size, { size: 18 });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Size"] });
                }
                break;
            }

            case "size": {
                if (!p1) {
                    return makeStyle(Formats.Size, { size: Number(argument[1]) });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Size"] });
                }
                break;
            }
            case "color": {
                if (!p1) {
                    return makeStyle(Formats.Color, { color: parseInt(argument[1].replace(/\#/g, ""), 16) });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Color"] });
                }
                break;
            }
            case "style": {
                if (!p1) {
                    const capitalize = s => s && s[0].toUpperCase() + s.slice(1)
                    styles.push(capitalize(argument[1]));
                    return makeStyle(Formats.Style, { style: [capitalize(argument[1])] });
                } else {
                    if (styles.length > 0) {
                        console.log(styles);
                        return makeStyle(Formats.Style, { style: [styles.pop()], disable: 1 });
                    }
                }
                break;
            }
            case "marquee": {
                if (!p1) {
                    return makeStyle(Formats.Style, { style: ["Marquee"] });
                } else {
                    return makeStyle(Formats.Style, { style: ["Marquee"], disable: 1 });
                    
                }
                break;
            }
            case "center": {
                if (!p1) {
                    return makeStyle(Formats.Style, { style: ["Center"] });
                } else {
                    return makeStyle(Formats.Style, { style: ["Center"], disable: 1 });
                    
                }
                break;
            }
            case "highlight": {
                if (!p1) {
                    return makeStyle(Formats.Highlight, { color: parseInt(argument[1].replace(/\#/g, ""), 16) });
                } else {
                    return makeStyle(Formats.Reset, { style: ["Highlight"] });
                }
                break;
            }
            case "image": {
                if (!p1) {
                    if (arguments[2] && arguments[3]) {
                        return makeStyle(Formats.Image, { width: Number(argument[2]), height: Number(argument[3]), src: argument[1] });
                    } else {
                        return makeStyle(Formats.Image, { width: 0, height: 0, src: argument[1] });
                    }

                }
                break;
            }
        }
        return "";
    })
    return command;
}
function parseRichText(x) {
    let regex = /(?:[^\u2060\u2061\u2062\u2063\u2064\u2065\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F\u200B\u200C\uFEFF]+)|(?:([\u2060\u2061\u2062\u2063\u2064\u2065\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F\u200B\u200C]+\uFEFF)(\uFEFF[\u2060\u2061\u2062\u2063\u2064\u2065\u2068\u2069\u206A\u206B\u206C\u206D\u206E\u206F\u200B\u200C]+\uFEFF)?)/g;
    let commands = x.matchAll(regex);
    if (commands == null || commands == undefined) throw "Unable to parse rich text : no matches";
    if ([...x.matchAll(regex)][0][1] != makeStyle(Formats.Formatted)) throw "Unable to parse rich text : no format flag";
    formatted = "";
    toClose = [];

    for (const cmd of commands) {
        console.log(cmd)
        if (cmd[1] != undefined) {
            //console.log(num_base16d(cmd[1]) & 0xFF)
            switch (num_base16d(cmd[1]) & 0xFF) {
                case Formats.Color: {
                    let fmt = num_base16d(cmd[1]);
                    fmt = fmt >> 8 & 0xFFFFFF >>> 0;
                    formatted += `<rtcolor style="color: #${fmt.toString(16)}">`;
                    toClose.push('rtcolor')
                    break;
                }
                case Formats.Highlight: {
                    let fmt = num_base16d(cmd[1]);
                    fmt = fmt >> 8 & 0xFFFFFF >>> 0;
                    formatted += `<rthighlight style="background-color: #${fmt.toString(16)}">`;
                    toClose.push('rthighlight')
                    break;
                }
                case Formats.Style: {
                    let fmt = num_base16d(cmd[1]);
                    fmt = fmt >> 8 & 0xFFFFFF >>> 0;
                    if (fmt & BitFlags.Style.Blink) {
                        formatted += fmt & BitFlags.Style.Disable ? "</blink>" : "<blink>"
                        let lol = toClose.reverse().findIndex(x => x == "blink");
                        if (fmt & BitFlags.Style.Disable) {
                            if (lol != -1) toClose = (toClose.filter((v, index) => index !== lol, 1).reverse())
                        } else { toClose.push("blink") }
                    } else if (fmt & BitFlags.Style.Marquee) {
                        formatted += fmt & BitFlags.Style.Disable ? "</marquee>" : "<marquee>"
                        let lol = toClose.reverse().findIndex(x => x == "marquee");
                        if (fmt & BitFlags.Style.Disable) {
                            if (lol != -1) toClose = (toClose.filter((v, index) => index !== lol, 1).reverse())
                        } else { toClose.push("marquee") }
                    } else if (fmt & BitFlags.Style.Center) {
                        formatted += fmt & BitFlags.Style.Disable ? "</rtcenter>" : "<rtcenter style=\"display: block; text-align: center;\">"
                        let lol = toClose.reverse().findIndex(x => x == "rtcenter");
                        if (fmt & BitFlags.Style.Disable) {
                            if (lol != -1) toClose = (toClose.filter((v, index) => index !== lol, 1).reverse())
                        } else { toClose.push("rtcenter") }
                    }
                    break;
                }
                case Formats.Size: {
                    let fmt = num_base16d(cmd[1]);
                    fmt = fmt >> 8 & 0xFFFFFF >>> 0;
                    fmt > 72 ? fmt = 72 : 0
                    formatted += `<rtsize style="font-size: ${fmt.toString(10)}px">`;
                    toClose.push('rtsize')
                    break;
                }
                case Formats.Reset: {
                    let fmt = num_base16d(cmd[1]);
                    fmt = fmt >> 8 & 0xFFFFFF >>> 0;
                    if (fmt & BitFlags.Reset.All) {
                        //formatted += "</rtcolor></rtcolor></rthighlight></blink></marquee></rtsize>";
                    } if (fmt & BitFlags.Reset.Color) {
                        formatted += "</rtcolor>";
                    } if (fmt & BitFlags.Reset.Highlight) {
                        formatted += "</rthighlight>";
                    } if (fmt & BitFlags.Reset.Style) {
                        formatted += "</blink></marquee></rtcenter>";
                    } if (fmt & BitFlags.Reset.Size) {
                        formatted += "</rtsize>";
                    }
                    break;
                }
                case Formats.Image: {
                    let fmt = num_base16d(cmd[1]);
                    console.log(fmt.toString(16))
                    fmt = fmt >> 8 & 0xFFFFFF >>> 0;
                    console.log(fmt.toString(16))
                    if (!cmd[2]) continue;
                    let width = fmt >> 12 & 0xFFF;
                    if (width == 0) width = 320;
                    let height = fmt & 0xFFF;
                    if (height == 0) height = 180;

                    let src = ascii_base16d(cmd[2].slice(1, -1)).replace(/"/g, "");
                    console.log(src);
                    let url = (new URL(src));

                    if (url.hostname == "cdn.discordapp.com" || url.hostname == "cdn.discord.com" || url.hostname == "media.discordapp.net") {
                        formatted += `<img width="${width}" height="${height}" src="${src}">`;
                        break;
                    }


                    // intentional fall through?
                }
                default: {
                    // unknown

                }
            }
        } else {
            formatted += cmd[0];
        }
    }

    for (close of toClose.reverse()) {
        formatted += `</${close}>`;
    }
    return formatted;
}

function patchMessage(n) {
    console.log(n);
    let content = n;
    if (content.id.startsWith("chat-messages-")) {
        content = $(content).find('[id^="message-content-"]')[0];
    }
    if (content != undefined) {
        if (content.innerHTML.startsWith(makeStyle(Formats.Formatted, {}))) {
            content.innerHTML = parseRichText(content.innerHTML);
        }
    }

}

function patchMessages(n) {
    let messages = $(n).find('[id^="message-content-"]');
    for (m of messages) {
        if (m.innerHTML.startsWith(makeStyle(Formats.Formatted, {}))) {
            m.innerHTML = parseRichText(m.innerHTML);
        }
    }

}



module.exports = class ExamplePlugin {
    messageObserver = null;

    start() {

        // FUCK YOU! VANILLA PLUGIN
        //if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing", `The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);
        if (this.messageObserver) this.messageObserver.disconnect();
        this.onstart();

    }
    onstart() {
        var send = send || XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function () {
            try {
                let tmp = arguments;
                if (arguments[0] == undefined || arguments[0] == null) { send.call(this, ...arguments); return; }
                console.log(arguments[0]);
                let tmp2 = JSON.parse(arguments[0]);
                if (tmp2 == null) { send.call(this, ...arguments); return; }
                if (tmp2.content == undefined || tmp2.content == null) { send.call(this, ...arguments); return; }
                tmp2.content = parseToRichText(tmp2.content);
                tmp[0] = JSON.stringify(tmp2);
                send.call(this, ...tmp);
            } catch (er) {
                send.call(this, ...arguments);
                console.log(er);

            }
        }

        if (this.messageObserver) this.messageObserver.disconnect();
        try { jQuery } catch (a) {

            // almost
            var script = document.createElement('script');
            script.src = 'https://code.jquery.com/jquery-3.4.1.min.js';
            script.type = 'text/javascript';
            document.getElementsByTagName('head')[0].appendChild(script);
        }
        setTimeout(() => {
            try {

                this.messageObserver = new MutationObserver(mutations => {
                    for (let i = 0; i < mutations.length; i++) {
                        if (mutations[i].addedNodes[0]) {
                            try {
                                if (mutations[i].addedNodes[0].className.startsWith("chatContent-")) patchMessages(mutations[i].addedNodes[0]);
                                if (mutations[i].addedNodes[0].id.startsWith("chat-messages-") || mutations[i].addedNodes[0].id.startsWith("message-content-")) patchMessage(mutations[i].addedNodes[0]);
                            } catch (e) {}
                        }
                    }
                });

                this.messageObserver.observe($('[class^="content"]')[0], { childList: true, subtree: true });
            } catch (e) { }
        }, 500)
    }
    unload() {
        if (this.messageObserver) this.messageObserver.disconnect();
    }
    stop() {
        if (this.messageObserver) this.messageObserver.disconnect();
    }


}
