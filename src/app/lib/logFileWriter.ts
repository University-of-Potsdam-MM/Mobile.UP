import { File } from '@ionic-native/file/ngx';
import { Platform } from '@ionic/angular';
import { FileEntry } from '@ionic-native/file';

export const writeToLogFile = (logString: string) => {
  const newFile = new File();
  /*newFile.writeFile(newFile.dataDirectory, "testFileName", logString)
    .then()
    .catch(e => console.error(e));*/

  const formPage = new FormsPage(newFile);
  formPage.createFile().then((_) => {
    formPage.writeFile();
  });
};

export class FormsPage {
  private promise: Promise<string>;

  private stringToWrite: string;

  private blob: Blob;

  constructor(private file: File) {}

  async createFile() {
    return this.file.createFile(this.file.dataDirectory, 'filename', true);
  }

  async readFile() {
    this.promise = this.file.readAsText(this.file.dataDirectory, 'filename');
    await this.promise.then((value) => {
      console.log(value);
    });
  }

  writeFile() {
    this.stringToWrite = 'I learned this from Medium';
    this.blob = new Blob([this.stringToWrite], { type: 'text/plain' });
    this.file.writeFile(this.file.dataDirectory, 'filename', this.blob, {
      replace: true,
      append: false,
    });
  }
}
