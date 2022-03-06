import { AfterViewInit, Component, OnInit, ViewChild, } from '@angular/core';
import { Form, FormBuilder, FormControl, FormGroup, NgForm, ReactiveFormsModule } from '@angular/forms';
import { filter, from, Observable, Subject, tap } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import * as emoji from 'node-emoji';

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

  constructor() {
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
    this.emojiArray = EMOJIS.sort().slice(0, 36); // 36 distinct characters
    const emojiStr = this.emojiArray.join("");
    this.emojiWords = this.makeEmojiWords(emojiStr);
    for (let i = 0; i < this.emojiWords.length; i++) {
      this.emojiIndexMap.set(this.emojiWords[i], i);
    }
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    this.secretForm.valueChanges.pipe(
      tap(form => this.secret = form['secret'].trim())
    ).subscribe(
      (form: any) => {
        // console.log(form);
        if (this.isEncryptMode())
          this.encrypt();
        else
          this.decrypt();
      }
    )
    this.plainTextForm.valueChanges.pipe(
      filter(f => this.isEncryptMode()),
      tap(form => this.plainText = form['plainText']),
    ).subscribe(
      (form: any) => {
        // console.log(form);
        this.encrypt();
      }
    );
    this.emojiTextForm.valueChanges.pipe(
      filter(f => this.isDecryptMode()),
      tap(form => this.emojiText = form['emojiText']),
    ).subscribe(
      (form: any) => {
        // console.log(form);
        this.decrypt();
      }
    );
  }

  encrypt() {
    if (this.plainText.length > 0) {
      this.emojiText = this.plainTextToEmoji(this.plainText);
    } else {
      this.emojiText = "";
    }
    this.emojiTextForm.controls['emojiText']?.setValue(this.emojiText);
  }

  decrypt() {
    if (this.emojiText.length > 0) {
      this.plainText = this.emojiToPlainText(this.emojiText);
    } else {
      this.plainText = "";
    }
    this.plainTextForm.controls['plainText']?.setValue(this.plainText);
  }

  plainTextToEmoji(plainText: string) {
    const cipherStr = this.encryptPlainText(plainText)
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
    if (emojiWords.length % 2 != 0)
      return "invalid cipher";
    let baseEncoded = [];
    for (let i = 0; i < emojiWords.length; i = i + 2) {
      const char1 = this.indexToChar( this.emojiWordToIndex(emojiWords[i]) );
      const char2 = this.indexToChar( this.emojiWordToIndex(emojiWords[i+1]) );
      baseEncoded.push(char1 + char2)
    }
    const cipher = this.encodedToCipher(baseEncoded);
    const decrypted = this.decryptCipherText(cipher);
    return decrypted;
  }  

  encryptPlainText(plainText: string): string {
    return CryptoJS.AES.encrypt(plainText, this.secret).toString()
  }

  decryptCipherText(cipherText: string) {
    const decryptData = CryptoJS.AES.decrypt(cipherText, this.secret)
    const decryptedStr = decryptData.toString(CryptoJS.enc.Utf8);
    if (decryptedStr.length > 0)
      return decryptedStr;
    return "invalid cipher dec"
  }

  isEncryptMode() {
    return this.mode == Mode.encrypt;
  }

  isDecryptMode() {
    return this.mode == Mode.decrypt;
  }

  toggleMode() {
    this.mode = this.isEncryptMode() ? Mode.decrypt : Mode.encrypt;
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
  "🥺",
  "🐖",
  "👼",
  // "👼🏽",
  "🍯",
  "🌿",
  "👫",
  // "👩🏽‍🤝‍👨🏼",
  "🤠",
  "👩‍🌾",
  // "👩🏽‍🌾",
  "🐑",
  "🍓",
  "🤤",
  "❤️",
  "❣️",
  "😚",
  "🤧",
  "😍",
  "🤟",
  // "🤟🏽",
  "🥳",
  "⭐️",
  "😭",
  "🤩",
  "🪴",
  "🌹",
  "🤍",
  // "🖤",
  "💖",
  "🌳",
  "🍃",
  "🍂",
  "🌷",
  "💐",
  "🌺",
  "🌸",
  "🌼",
  "🍄",
  // "💙",
  "🧡",
  "💛",
  // "💚",
  // "💜",
  // "🤎",
]