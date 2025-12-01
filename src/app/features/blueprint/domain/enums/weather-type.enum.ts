/**
 * Weather Type Enum
 *
 * 天氣類型枚舉 - 用於施工日誌
 *
 * @module features/blueprint/domain/enums
 */

export enum WeatherType {
  /** 晴天 */
  SUNNY = 'sunny',
  /** 多雲 */
  CLOUDY = 'cloudy',
  /** 雨天 */
  RAINY = 'rainy',
  /** 暴風 */
  STORMY = 'stormy',
  /** 雪天 */
  SNOWY = 'snowy',
  /** 霧天 */
  FOGGY = 'foggy'
}

export const WeatherTypeLabels: Record<WeatherType, string> = {
  [WeatherType.SUNNY]: '晴天',
  [WeatherType.CLOUDY]: '多雲',
  [WeatherType.RAINY]: '雨天',
  [WeatherType.STORMY]: '暴風',
  [WeatherType.SNOWY]: '雪天',
  [WeatherType.FOGGY]: '霧天'
};

export const WeatherTypeIcons: Record<WeatherType, string> = {
  [WeatherType.SUNNY]: '☀️',
  [WeatherType.CLOUDY]: '⛅',
  [WeatherType.RAINY]: '🌧️',
  [WeatherType.STORMY]: '⛈️',
  [WeatherType.SNOWY]: '❄️',
  [WeatherType.FOGGY]: '🌫️'
};
