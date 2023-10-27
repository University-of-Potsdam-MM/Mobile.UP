import { File } from '@awesome-cordova-plugins/file/ngx';

export const writeToLogFile = (fileName: string, logString: string) => {
  //newFile.writeFile(newFile.dataDirectory, "testFileName", logString)
  //  .then()
  //  .catch(e => console.error(e));

  const newFile: File = new File();
  const formPage = new FormsPage(fileName, newFile);
  formPage.createFile().then((_) => {
    formPage.writeFile(logString);
  });
};

export class FormsPage {
  private promise: Promise<string>;

  private stringToWrite: string;

  private blob: Blob;

  constructor(private fileName: string, private file: File) {}

  async createFile() {
    return this.file.createFile(this.file.dataDirectory, this.fileName, true);
  }

  async readFile() {
    this.promise = this.file.readAsText(this.file.dataDirectory, this.fileName);
    await this.promise.then((value) => {
      console.log(value);
    });
  }

  writeFile(logString: string) {
    this.stringToWrite = logString;
    console.log('[FormsPage]: write String: ' + this.stringToWrite);
    this.blob = new Blob([this.stringToWrite], { type: 'text/plain' });
    this.file
      .writeFile(this.file.dataDirectory, this.fileName, this.blob, {
        replace: true,
        append: false,
      })
      .then(() => {
        console.log('[FormsPage]: wrote Log file');
      });
  }

  private createFileName() {
    return 'MobileUPTestLog'; // + (new Date().toDateString()).replace(" ","-");
  }
}
