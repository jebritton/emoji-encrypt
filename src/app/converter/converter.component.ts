import { AfterViewInit, Component, OnInit, ViewChild, } from '@angular/core';
import { Form, FormBuilder, FormControl, FormGroup, NgForm, ReactiveFormsModule } from '@angular/forms';
import { filter, from, Observable, Subject, tap } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import * as emoji from 'node-emoji';
// import * as niceware from 'niceware';
import { Clipboard } from '@angular/cdk/clipboard'
import { faEraser, faIcons, faKeyboard, faKey, faLock, faUnlock, faCopy as faCopySolid, faEnvelopeOpenText } from '@fortawesome/free-solid-svg-icons';
import { faCopy, faEye, faEyeSlash } from '@fortawesome/free-regular-svg-icons';
// import { } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-converter',
  templateUrl: './converter.component.html',
  styleUrls: ['./converter.component.scss']
})
export class ConverterComponent implements OnInit, AfterViewInit {
  secretForm: FormGroup;
  plainTextForm: FormGroup;
  emojiTextForm: FormGroup;

  mode: Mode = Mode.encrypt;
  secret: string = "";
  plainText: string = "";
  emojiText: string = "";

  emojiArray: string[];
  emojiWords: string[];
  emojiIndexMap: Map<string, number> = new Map<string, number>();

  decodedSuccess: boolean = false;
  isInvalidInput: boolean = false;
  invalidMessage: string = "";

  showSecret: boolean = true;

  // icons
  faCopy = faCopy;
  faCopySolid = faCopySolid;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faKey = faKey;
  faLock = faLock;
  faUnlock = faUnlock;
  faIcons = faIcons;
  faKeyboard = faKeyboard;
  faEnvelopeOpenText = faEnvelopeOpenText;
  faEraser = faEraser;

  plainCopied = false;
  emojiCopied = false;

  constructor(
    private clipboard: Clipboard
  ) {
    // create 3 forms to monitor separately
    this.secretForm = new FormGroup({
      secret: new FormControl()
    });
    this.plainTextForm = new FormGroup({
      plainText: new FormControl()
    });
    this.emojiTextForm = new FormGroup({
      emojiText: new FormControl()
    });
    // create Emoji array and map
    // this.emojiArray = EMOJIS.sort().slice(0, 36); // 36 distinct characters
    this.emojiArray = EMOJIS.slice(0, 36); // 36 distinct characters
    const emojiStr = this.emojiArray.join("");
    this.emojiWords = this.makeEmojiWords(emojiStr);
    for (let i = 0; i < this.emojiWords.length; i++) {
      this.emojiIndexMap.set(this.emojiWords[i], i);
    }
    const s = ":"+this.emojiWords.join("::")+":"
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.secretForm.valueChanges.pipe(
      tap(form => this.secret = form['secret'].trim())
    ).subscribe(
      (form: any) => {
        this.update();
      }
    )
    this.plainTextForm.valueChanges.pipe(
      filter(f => this.isEncryptMode()),
      tap(form => this.plainText = form['plainText']),
    ).subscribe(
      (form: any) => {
        this.encrypt();
      }
    );
    this.emojiTextForm.valueChanges.pipe(
      filter(f => this.isDecryptMode()),
      tap(form => this.emojiText = form['emojiText']),
    ).subscribe(
      (form: any) => {
        this.decrypt();
      }
    );
  }

  encrypt() {
    this.resetInvalid();
    if (this.plainText.length > 0) {
      try {
        this.emojiText = this.plainTextToEmoji(this.plainText);
      } catch {
        this.emojiText = "";
        this.isInvalidInput = true;
        this.invalidMessage = "This message could not be encrypted.";
      }
    } else {
      this.emojiText = "";
    }
    this.emojiTextForm.controls['emojiText']?.setValue(this.emojiText);
  }

  decrypt() {
    this.resetInvalid();
    if (this.emojiText.length > 0) {
      try {
        this.plainText = this.emojiToPlainText(this.emojiText);
      } catch {
        this.plainText = "";
        this.isInvalidInput = true;
        this.invalidMessage = "Invalid emoji cipher.";
      }
    } else {
      this.plainText = "";
    }
    this.plainTextForm.controls['plainText']?.setValue(this.plainText);
  }

  plainTextToEmoji(plainText: string) {
    let cipherStr = this.encryptPlainText(plainText);
    console.log(cipherStr)
    cipherStr = cipherStr.substring(10); // remove "Salted__"
    console.log(cipherStr)
    const baseEncoded = this.cipherToEncoded(cipherStr);
    let cipherEmoji = "";
    baseEncoded.forEach((code: string) => {
      let emoji1 = this.indexToEmoji( this.charToIndex( code.charAt(0) ) );
      let emoji2 = this.indexToEmoji( this.charToIndex( code.charAt(1) ) );
      cipherEmoji = cipherEmoji + emoji1 + emoji2;
    });
    return cipherEmoji;
  }

  emojiToPlainText(emojiText: string): string {
    let emojiWords = this.makeEmojiWords(emojiText)
    let baseEncoded = [];
    for (let i = 0; i < emojiWords.length; i = i + 2) {
      const char1 = this.indexToChar( this.emojiWordToIndex(emojiWords[i]) );
      const char2 = this.indexToChar( this.emojiWordToIndex(emojiWords[i+1]) );
      baseEncoded.push(char1 + char2)
    }
    let cipherStr = this.encodedToCipher(baseEncoded);
    console.log(cipherStr)
    cipherStr = btoa("Salted__").slice(0, 10) + cipherStr
    console.log(cipherStr)
    const decrypted = this.decryptCipherText(cipherStr);
    return decrypted;
  }  

  encryptPlainText(plainText: string): string {
    return CryptoJS.AES.encrypt(plainText, this.secret).toString()
  }

  decryptCipherText(cipherText: string) {
    const decryptData = CryptoJS.AES.decrypt(cipherText, this.secret)
    const decryptedStr = decryptData.toString(CryptoJS.enc.Utf8);
    if (decryptedStr.length == 0) {
      this.isInvalidInput = true;
      this.invalidMessage = "Invalid emoji cipher."
      return "";
    }
    this.decodedSuccess = true;
    return decryptedStr;
  }

  isEncryptMode() {
    return this.mode == Mode.encrypt;
  }

  isDecryptMode() {
    return this.mode == Mode.decrypt;
  }

  toggleMode() {
    this.mode = this.isEncryptMode() ? Mode.decrypt : Mode.encrypt;
    // this.resetInvalid();
    this.update();
  }

  setEncrypt() {
    this.mode = Mode.encrypt;
  }

  setDecrypt() {
    this.mode = Mode.decrypt;
  }

  cipherToEncoded(cipherText: string): string[] {
    let baseEncoded = [];
    for (let i = 0; i < cipherText.length; i++) {
      baseEncoded.push( cipherText.charCodeAt(i).toString(36).padStart(2, '0') );
    }
    return baseEncoded;
  }

  encodedToCipher(encodedString: string[]): string {
    let decodedCipher = "";
    for (let i = 0; i < encodedString.length; i++) {
      decodedCipher = decodedCipher + String.fromCharCode(parseInt(encodedString[i], 36));
    }
    return decodedCipher;
  }

  charToIndex(code: string): number {
    return parseInt(code, 36);
  }

  indexToChar(index: number): string {
    return index.toString(36);
  }

  emojiWordToIndex(emojiWord: string): number {
    return this.emojiIndexMap.get(emojiWord) ?? 0;
  }

  // indexToEmoji(index: number): string {
  //   return this.emojiArray[index] ?? "";
  // }

  indexToEmoji(index: number): string {
    return emoji.get(this.emojiWords[index] ?? "not found");
  }

  makeEmojiWords(emojiText: string): string[] {
    const unemoji = emoji.unemojify(emojiText);
    let emojiWords = emoji.emojify(unemoji, undefined, format).split(',');
    if (emojiWords[emojiWords.length - 1].length == 0)
      emojiWords.pop()
    return emojiWords;
  }

  resetInvalid() {
    this.decodedSuccess = false;
    this.isInvalidInput = false;
    this.invalidMessage = "";
  }

  update() {
    if (this.isEncryptMode())
      this.encrypt();
    else
      this.decrypt();
  }
  
  toggleShowSecret() {
    this.showSecret = !this.showSecret;
  }

  copyText(field: string) {
    const toCopy = field == 'plainText' ? this.plainText : this.emojiText;
    if (toCopy.length == 0)
      return;
    const pending = this.clipboard.beginCopy(toCopy);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        if (field == 'plainText') {
          this.plainCopied = true;
          setTimeout(() => this.plainCopied = false, 1500)
        } else {
          this.emojiCopied = true;
          setTimeout(() => this.emojiCopied = false, 1500)
        }
        pending.destroy();
      }
    };
    attempt();
  }

  clearPlainText() {
    this.plainTextForm.controls['plainText']?.setValue("");
  }

  clearEmojiText() {
    this.emojiTextForm.controls['emojiText']?.setValue("");
  }

}

// emoji format
let format = function (code: string, name: string) {
  return name+',';
}

export enum Mode {
  encrypt,
  decrypt
}

export const EMOJIS = [
  "🐖", // not common (0)
  "❤️", //  common (1), which appears a lot in base 36
  "🥺", // common
  "🍯",
  "🌿",
  "👫",
  "🤠",
  "👩‍🌾",
  "⭐️",
  "🍓",
  "🤤",
  "👼",
  "❣️",
  "😚",
  "🤧",
  "😍",
  "🌳",
  "🥳",
  "🐑",
  "😭",
  "🤩",
  "🪴",
  "🌹",
  "🤍",
  "💖",
  "🤟",
  "🍃",
  "🍂",
  "🌷",
  "💐",
  "🌺",
  "🌸",
  "🌼",
  "🍄",
  "💛",
  "🐷", // index 35, the 36th element
  // "👩🏽‍🤝‍👨🏼",
  // "👩🏽‍🌾",
  // "🤟🏽",
  // "🖤",
  // "🧡",
  // "💚",
  // "💜",
  // "🤎",
  // "💙",
  // "👼🏽",
]