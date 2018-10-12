import { ESettingType } from "../../library/interfaces";

// See Settings README.md for info on how to create Settings

export const SETTINGS = [
    {
        key: "language",
        value: "Deutsch",
        options: [{key: "Deutsch", lbl: "Deutsch"}, {key: "Englisch", lbl: "Englisch"}],
        type: ESettingType.string_radio,
        icon: "globe-outline"
    },
    {
        key: "campus",
        value: "Griebnitzsee",
        options: [{key: "Neues Palais", lbl: "Neues Palais"}, {key: "Griebnitzsee", lbl: "Griebnitzsee"}, {key: "Golm", lbl: "Golm"}],
        type: ESettingType.string_radio,
        icon: "locate-outline"
    }
];