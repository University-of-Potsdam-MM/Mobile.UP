import { File } from '@awesome-cordova-plugins/file/ngx';

export const writeToLogFile = (logString: string) => {
  //newFile.writeFile(newFile.dataDirectory, "testFileName", logString)
  //  .then()
  //  .catch(e => console.error(e));

  const newFile: File = new File();
  const formPage = new FormsPage(newFile);
  formPage.createFile().then((_) => {
    formPage.writeFile(logString);
  });
};

export class FormsPage {
  private promise: Promise<string>;

  private stringToWrite: string;

  private blob: Blob;

  private fileName: string;

  constructor(private file: File) {
    this.fileName = this.createFileName();
  }

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
    this.blob = new Blob([this.stringToWrite], { type: 'text/plain' });
    this.file.writeFile(this.file.dataDirectory, this.fileName, this.blob, {
      replace: true,
      append: false,
    });
  }

  private createFileName() {
    return 'MobileUPTestLog' + new Date().toDateString();
  }
}
