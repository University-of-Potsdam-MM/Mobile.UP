import { ESettingType } from "../../library/interfaces";

// See Settings README.md for info on how to create Settings

export const SETTINGS = [
    {
        key: "general",
        type: ESettingType.placeholder
    },
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
    },
    {
        key: "inpractice",
        type: ESettingType.placeholder
    },
    {
        key: "practice",
        value: "Jobs für Studierende, Jobs für Absolventen, Abschlussarbeit, Praktika",
        options: [{key: "Jobs für Studierende"}, {key: "Jobs für Absolventen"}, {key: "Abschlussarbeit"}, {key: "Praktika"}],
        type: ESettingType.checkbox,
        icon: "ios-filing-outline"
    },
    {
        key: "studyarea",
        value: "",
        options: [
            {key: "Geistes- und Kulturwissenschaften"},
            {key: "Wirtschafts- und Sozialwissenschaften"},
            {key: "Mathematik und Informatik"},
            {key: "Naturwissenschaften"},
            {key: "Rechtswissenschaften"},
            {key: "Bildungs- und Kognitionswissenschaften"},
            {key: "Sport- und Gesundheitswissenschaften"},
            {key: "fächerübergreifend"},
        ],
        type: ESettingType.checkbox,
        icon: "ios-filing-outline"
    },
    {
        key: "domestic",
        value: true,
        type: ESettingType.boolean,
        icon: "ios-plane-outline",
        options: []
    },
    {
        key: "foreign",
        value: true,
        type: ESettingType.boolean,
        icon: "ios-plane-outline",
        options: []
    }
];