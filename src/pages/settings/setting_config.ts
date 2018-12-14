import { ESettingType } from "../../library/interfaces";

// See Settings README.md for info on how to create Settings

export const SETTINGS = [
    {
        key: "language",
        value: "Deutsch",
        options: [{key: "Deutsch"}, {key: "Englisch"}],
        type: ESettingType.string_radio,
        icon: "ios-globe-outline"
    },
    {
        key: "campus",
        value: "Griebnitzsee",
        options: [{key: "Neues Palais"}, {key: "Griebnitzsee"}, {key: "Golm"}],
        type: ESettingType.string_radio,
        icon: "ios-locate-outline"
    }
];