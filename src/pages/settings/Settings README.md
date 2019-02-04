# Settings README

This is a quick guide on how to create and use settings.

### Read Settings in Page

To Read a Setting on any Page use the following code

```typescript
//import settings provider
import {SettingsProvider} from "../../providers/settings/settings";

export class MyPage {
    // inject setting provider in constructor
    constructor( public settingProvider: SettingsProvider) {}

    ionViewDidLoad() {
        this.myFunc();
    }

    // use settings in async function
    async myFunc(){
        // get setting by defined key
        let mySetting = await this.settingProvider.getSettingValue("<setting_key>");
    }
}
```

By using the `settingProvider` the setting value will automatically be converted to the appropriate type.

Settings can also be loaded manually from storage by using

```typescript
let setting: ISetting = await this.storage.get("settings.<setting_key>");
```

### Create new Setting

To create a new Setting simply create a new JS Object inside the settings array in `src\pages\settings\setting_config.ts`

The following is an example for the `setting_config.ts` file with 6 different settings and two placeholders.

```typescript
import {ESettingType} from "../../library/interfaces";

export const SETTINGS = [
  {key: "test_ph", value: false, type: ESettingType.placeholder, icon: "ionic"},
  {key: "test_1", value: "", type: ESettingType.string, icon: "ionic", options: []},
  {key: "test_2", value: 0, type: ESettingType.number, icon: "ionic", options: []},
  {key: "test_3", value: false, type: ESettingType.boolean, icon: "ionic", options: []},
  {key: "test_ph", value: false, type: ESettingType.placeholder, icon: "ionic",},
  {
    key: "test_4",
    value: "0",
    options: [{key: 0}, {key: 1}, {key: 2}],
    type: ESettingType.number_radio,
    icon: "ionic",
  },
  {
    key: "test_5",
    value: "test 1",
    options: [{key: "test_1"}, {key: "test_2"}, {key: "test_3"}],
    type: ESettingType.string_radio,
    icon: "ionic",
  },
  {
    key: "test_6",
    value: "test_1",
    options: [{key: "test_1"}, {key: "test_2"}, {key: "test_3"}],
    type: ESettingType.checkbox,
    icon: "ionic",
  }
];

```

Technically this is everything needed for the setting to show up in the Settings page, but without adding appropriate translation entries, the setting will be displayed as the key. For more info see Translation.

### Setting

A Setting consists of the following keys

| Name    | Note                                                         |
| ------- | ------------------------------------------------------------ |
| key     | Key by which the setting is identified                        |
| value   | value of setting, type depending on setting type             |
| options | (radio/checkbox only) list of options each with a Key        |
| lbl     | Both in options and in the main setting, are created automatically from key translation (see Translation) |
| info    | Info text for setting                                        |
| type    | Type of Enum Class (see Types)                               |
| icon    | Ionic icon string (see https://ionicframework.com/docs/ionicons/) |

### Translation

For a setting to displayed nicely and contain some information about the setting, a translation entry needs to be created for every setting.

Translations are created under `page > settings > setting`

For a single choice setting this would look like this

```json
{
  "page":{
    ...
    "settings": {
      "title": "Einstellungen",
      "setting": {
        "test_1": {
          "lbl": "Test 1",
          "info": "Lorem ipsum dolor sit amet"
        }
      }
    }
	...
}
```

For radio or checkbox settings the options need to be localized as well

```json
{
  "page":{
    ...
    "settings": {
      "title": "Einstellungen",
      "setting": {
        "test_5": {
              "lbl": "Test 5",
              "info": "Lorem ipsum dolor sit amet",
              "options": {
              	"test_1": "Test 1",
              	"test_3": "Test 3"
          	   }
        }
      }
    }
	...
}
```

in `options` each key of the settings options array needs to occur, if not, the option is displayed as the key (this allows numeric choice settings to leave out the translation). In General: If a translations are missing the `key` is displayed. `info` will be blank if a translation is missing.

For Placeholders only a lbl is requrired

```json
{
  "page":{
    ...
    "settings": {
      "title": "Einstellungen",
      "setting": {
        	"test_ph": {
          		"lbl": "Header"
        	}
        }
      }
    }
	...
}
```

### Types

There are 7 supported types of settings.

| Typename     | Type         | Info                                             |
| ------------ | ------------ | ------------------------------------------------ |
| boolean      | boolean      | Simple bolean setting displayed as toggle button |
| string       | string       | Simple string input                              |
| number       | number       | Simple number input                              |
| number_radio | number       | Radio to select single choice number             |
| string_radio | string       | Radio to select single choice string             |
| checkbox     | string Array | Select any number of options                     |
| placeholder  | /            | Only to display a placeholder in settings page   |















