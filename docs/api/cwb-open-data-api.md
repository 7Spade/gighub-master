# 中央氣象局開放資料平台 API 開發文檔

## 文檔版本
- **API 版本**: 1.0.0
- **文檔更新日期**: 2025-12-06
- **適用範圍**: 台灣中央氣象局開放資料平台 (CWB Open Data Platform)

---

## 目錄
1. [平台簡介](#平台簡介)
2. [API 基本資訊](#api-基本資訊)
3. [認證與授權](#認證與授權)
4. [資料類別與端點](#資料類別與端點)
5. [請求與回應格式](#請求與回應格式)
6. [程式碼範例](#程式碼範例)
7. [錯誤處理](#錯誤處理)
8. [速率限制與配額](#速率限制與配額)
9. [最佳實踐](#最佳實踐)
10. [常見問題](#常見問題)

---

## 平台簡介

中央氣象局開放資料平台（CWB Open Data Platform）提供台灣地區的氣象觀測、預報及特報等資料，供開發者整合至應用程式中。

### 主要特色
- ✅ **即時資料更新**: 提供最新的氣象觀測資料
- 🌡️ **多元資料類型**: 包含天氣預報、觀測資料、地震資訊、颱風路徑等
- 🔓 **開放存取**: 提供 API 金鑰免費註冊使用
- 📊 **標準格式**: 支援 JSON、XML 等格式
- 🚀 **高可用性**: 穩定的服務品質

### 適用場景
- 氣象資訊應用程式
- 農業管理系統
- 工地施工管理系統（如 GigHub）
- 災害預警系統
- 旅遊規劃平台

---

## API 基本資訊

### Base URL
```
https://opendata.cwa.gov.tw/api
```

**注意**: 中央氣象局於 2024 年更名為「中央氣象署」(Central Weather Administration, CWA)，網域也從 `cwb.gov.tw` 更新為 `cwa.gov.tw`。

### 支援的通訊協定
- HTTPS (建議使用，確保資料安全)
- HTTP (僅供測試環境使用)

### 資料格式
- **JSON** (預設，推薦使用)
- **XML**

---

## 認證與授權

### 取得 API 金鑰

1. **註冊帳號**
   - 前往 [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)
   - 點擊「會員註冊」
   - 填寫個人資料並完成註冊

2. **申請 API 金鑰**
   - 登入後前往「取得授權碼」頁面
   - 選擇所需的資料類別
   - 系統會產生專屬的 API 授權碼（Authorization Key）

3. **金鑰管理**
   - 一個帳號可申請多組授權碼
   - 每組授權碼有獨立的使用配額
   - 可隨時在會員中心查看使用狀況

### 使用 API 金鑰

在每個 API 請求中加入授權碼參數：

```
https://opendata.cwa.gov.tw/api/v1/rest/datastore/{資料集ID}?Authorization={你的授權碼}
```

**安全建議**:
- 🔐 不要將 API 金鑰直接寫在前端程式碼中
- 🔑 使用環境變數或配置檔案管理金鑰
- 🔄 定期更換授權碼
- 🚫 不要將金鑰提交到版本控制系統（如 Git）

---

## 資料類別與端點

### 1. 一般天氣預報

#### 1.1 鄉鎮天氣預報-單一鄉鎮市區
**資料集 ID**: `F-D0047-091` (以台北市為例，其他縣市有不同代碼)

**端點**:
```
GET /v1/rest/datastore/F-D0047-091
```

**查詢參數**:
- `Authorization` (必填): API 授權碼
- `locationName` (可選): 特定鄉鎮市區名稱
- `elementName` (可選): 特定氣象要素（如溫度、降雨機率）
- `timeTo` (可選): 資料結束時間 (格式: YYYY-MM-DD)

**回應資料包含**:
- 天氣現象描述
- 降雨機率
- 最低/最高溫度
- 舒適度指數
- 12小時降雨機率
- 相對濕度
- 風向與風速

#### 1.2 縣市天氣預報
**資料集 ID**: `F-C0032-001`

**端點**:
```
GET /v1/rest/datastore/F-C0032-001
```

**特色**: 提供全台 22 縣市的 36 小時天氣預報

### 2. 觀測資料

#### 2.1 自動氣象站資料
**資料集 ID**: `O-A0003-001`

**端點**:
```
GET /v1/rest/datastore/O-A0003-001
```

**回應資料包含**:
- 測站資訊（名稱、經緯度、海拔高度）
- 觀測時間
- 溫度
- 氣壓
- 相對濕度
- 風向與風速
- 降雨量
- 日照時數

#### 2.2 局屬氣象站資料
**資料集 ID**: `O-A0001-001`

**端點**:
```
GET /v1/rest/datastore/O-A0001-001
```

### 3. 特殊天氣資訊

#### 3.1 地震報告
**資料集 ID**: `E-A0016-001` (顯著有感地震報告)

**端點**:
```
GET /v1/rest/datastore/E-A0016-001
```

**回應資料包含**:
- 地震編號
- 發震時間
- 震央位置（經緯度）
- 地震深度
- 芮氏規模
- 各地震度

#### 3.2 颱風警報
**資料集 ID**: `W-C0033-001`

**端點**:
```
GET /v1/rest/datastore/W-C0033-001
```

#### 3.3 豪（大）雨特報
**資料集 ID**: `W-C0033-002`

**端點**:
```
GET /v1/rest/datastore/W-C0033-002
```

### 4. 生活氣象指數

#### 4.1 紫外線指數
**資料集 ID**: `O-A0005-001`

**端點**:
```
GET /v1/rest/datastore/O-A0005-001
```

---

## 請求與回應格式

### 標準請求範例

#### 使用 JSON 格式（預設）
```http
GET /v1/rest/datastore/F-C0032-001?Authorization=YOUR_API_KEY HTTP/1.1
Host: opendata.cwa.gov.tw
Accept: application/json
```

#### 使用 XML 格式
```http
GET /v1/rest/datastore/F-C0032-001?Authorization=YOUR_API_KEY&format=XML HTTP/1.1
Host: opendata.cwa.gov.tw
Accept: application/xml
```

### 標準回應結構（JSON）

#### 成功回應
```json
{
  "success": "true",
  "result": {
    "resource_id": "F-C0032-001",
    "fields": [
      {
        "id": "datasetDescription",
        "type": "String"
      }
    ]
  },
  "records": {
    "datasetDescription": "三十六小時天氣預報",
    "location": [
      {
        "locationName": "臺北市",
        "weatherElement": [
          {
            "elementName": "Wx",
            "description": "天氣現象",
            "time": [
              {
                "startTime": "2025-12-06 18:00:00",
                "endTime": "2025-12-07 06:00:00",
                "parameter": {
                  "parameterName": "多雲時晴",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "description": "降雨機率",
            "time": [
              {
                "startTime": "2025-12-06 18:00:00",
                "endTime": "2025-12-07 06:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "%"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "description": "最低溫度",
            "time": [
              {
                "startTime": "2025-12-06 18:00:00",
                "endTime": "2025-12-07 06:00:00",
                "parameter": {
                  "parameterName": "18",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "description": "最高溫度",
            "time": [
              {
                "startTime": "2025-12-06 18:00:00",
                "endTime": "2025-12-07 06:00:00",
                "parameter": {
                  "parameterName": "22",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### 回應欄位說明

| 欄位 | 型別 | 說明 |
|------|------|------|
| `success` | String | API 呼叫是否成功 ("true" / "false") |
| `result.resource_id` | String | 資料集識別碼 |
| `records.datasetDescription` | String | 資料集描述 |
| `records.location` | Array | 地點資料陣列 |
| `location[].locationName` | String | 地點名稱 |
| `location[].weatherElement` | Array | 氣象要素陣列 |
| `weatherElement[].elementName` | String | 要素代碼（如 Wx, PoP, MinT, MaxT） |
| `weatherElement[].description` | String | 要素中文描述 |
| `weatherElement[].time` | Array | 時間區間資料 |
| `time[].startTime` | String | 起始時間 (ISO 8601) |
| `time[].endTime` | String | 結束時間 (ISO 8601) |
| `time[].parameter` | Object | 預報值 |
| `parameter.parameterName` | String | 數值或描述 |
| `parameter.parameterUnit` | String | 單位（如 C, %, mm） |

### 氣象要素代碼對照表

| 代碼 | 中文名稱 | 說明 | 單位 |
|------|----------|------|------|
| `Wx` | 天氣現象 | 天氣狀況文字描述 | - |
| `PoP` | 降雨機率 | 降雨機率百分比 | % |
| `MinT` | 最低溫度 | 時段內最低溫度 | °C |
| `MaxT` | 最高溫度 | 時段內最高溫度 | °C |
| `CI` | 舒適度指數 | 人體舒適度指標 | - |
| `WeatherDescription` | 天氣預報綜合描述 | 完整天氣狀況描述 | - |
| `RH` | 相對濕度 | 空氣中水氣含量 | % |
| `WS` | 風速 | 平均風速 | m/s |
| `WD` | 風向 | 16 方位風向 | - |
| `T` | 溫度 | 觀測溫度 | °C |
| `PRES` | 氣壓 | 海平面氣壓 | hPa |
| `Rain` | 降雨量 | 累積降雨量 | mm |

---

## 程式碼範例

### TypeScript / JavaScript (Angular)

#### 1. 建立 Weather Service

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/**
 * CWB API 回應介面
 */
export interface CwbApiResponse {
  success: string;
  result: {
    resource_id: string;
    fields: Array<{ id: string; type: string }>;
  };
  records: {
    datasetDescription: string;
    location: CwbLocation[];
  };
}

export interface CwbLocation {
  locationName: string;
  weatherElement: CwbWeatherElement[];
}

export interface CwbWeatherElement {
  elementName: string;
  description: string;
  time: CwbTimeData[];
}

export interface CwbTimeData {
  startTime: string;
  endTime: string;
  parameter: {
    parameterName: string;
    parameterValue?: string;
    parameterUnit?: string;
  };
}

/**
 * 簡化的天氣資料介面
 */
export interface WeatherForecast {
  locationName: string;
  startTime: string;
  endTime: string;
  weatherDescription: string;
  temperature: {
    min: number;
    max: number;
    unit: string;
  };
  rainProbability: number;
  humidity?: number;
}

/**
 * 中央氣象署開放資料平台 API 服務
 */
@Injectable({
  providedIn: 'root'
})
export class CwbWeatherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
  
  // API 授權碼應從環境變數或配置服務中取得
  private readonly apiKey = 'YOUR_API_KEY'; // ⚠️ 應使用環境變數

  /**
   * 取得縣市天氣預報（36小時）
   * @param locationName 縣市名稱（可選），不提供則回傳全台資料
   */
  getCityWeatherForecast(locationName?: string): Observable<WeatherForecast[]> {
    const datasetId = 'F-C0032-001';
    let params = new HttpParams().set('Authorization', this.apiKey);
    
    if (locationName) {
      params = params.set('locationName', locationName);
    }

    return this.http.get<CwbApiResponse>(`${this.baseUrl}/${datasetId}`, { params }).pipe(
      map(response => this.transformWeatherData(response)),
      catchError(error => {
        console.error('CWB API 錯誤:', error);
        return throwError(() => new Error('無法取得天氣預報資料'));
      })
    );
  }

  /**
   * 取得鄉鎮天氣預報
   * @param countyCode 縣市代碼（例如：'091' 為台北市）
   * @param townshipName 鄉鎮市區名稱（可選）
   */
  getTownshipWeatherForecast(
    countyCode: string,
    townshipName?: string
  ): Observable<CwbApiResponse> {
    const datasetId = `F-D0047-${countyCode}`;
    let params = new HttpParams().set('Authorization', this.apiKey);
    
    if (townshipName) {
      params = params.set('locationName', townshipName);
    }

    return this.http.get<CwbApiResponse>(`${this.baseUrl}/${datasetId}`, { params }).pipe(
      catchError(error => {
        console.error('CWB API 錯誤:', error);
        return throwError(() => new Error('無法取得鄉鎮天氣預報資料'));
      })
    );
  }

  /**
   * 取得自動氣象站觀測資料
   * @param stationName 測站名稱（可選）
   */
  getWeatherStationData(stationName?: string): Observable<CwbApiResponse> {
    const datasetId = 'O-A0003-001';
    let params = new HttpParams().set('Authorization', this.apiKey);
    
    if (stationName) {
      params = params.set('StationName', stationName);
    }

    return this.http.get<CwbApiResponse>(`${this.baseUrl}/${datasetId}`, { params }).pipe(
      catchError(error => {
        console.error('CWB API 錯誤:', error);
        return throwError(() => new Error('無法取得氣象站觀測資料'));
      })
    );
  }

  /**
   * 取得地震報告
   * @param limit 回傳筆數限制
   */
  getEarthquakeReport(limit: number = 10): Observable<CwbApiResponse> {
    const datasetId = 'E-A0016-001';
    const params = new HttpParams()
      .set('Authorization', this.apiKey)
      .set('limit', limit.toString());

    return this.http.get<CwbApiResponse>(`${this.baseUrl}/${datasetId}`, { params }).pipe(
      catchError(error => {
        console.error('CWB API 錯誤:', error);
        return throwError(() => new Error('無法取得地震報告資料'));
      })
    );
  }

  /**
   * 轉換 API 回應為簡化的天氣預報格式
   */
  private transformWeatherData(response: CwbApiResponse): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];

    response.records.location.forEach(location => {
      const wxElement = location.weatherElement.find(el => el.elementName === 'Wx');
      const minTElement = location.weatherElement.find(el => el.elementName === 'MinT');
      const maxTElement = location.weatherElement.find(el => el.elementName === 'MaxT');
      const popElement = location.weatherElement.find(el => el.elementName === 'PoP');

      if (wxElement && wxElement.time.length > 0) {
        wxElement.time.forEach((timeData, index) => {
          const minT = minTElement?.time[index];
          const maxT = maxTElement?.time[index];
          const pop = popElement?.time[index];

          forecasts.push({
            locationName: location.locationName,
            startTime: timeData.startTime,
            endTime: timeData.endTime,
            weatherDescription: timeData.parameter.parameterName,
            temperature: {
              min: minT ? parseInt(minT.parameter.parameterName, 10) : 0,
              max: maxT ? parseInt(maxT.parameter.parameterName, 10) : 0,
              unit: minT?.parameter.parameterUnit || 'C'
            },
            rainProbability: pop ? parseInt(pop.parameter.parameterName, 10) : 0
          });
        });
      }
    });

    return forecasts;
  }
}
```

#### 2. 在 Component 中使用

```typescript
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CwbWeatherService, WeatherForecast } from './services/cwb-weather.service';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-weather-dashboard',
  standalone: true,
  imports: [CommonModule, SHARED_IMPORTS],
  template: `
    <nz-card nzTitle="天氣預報">
      @if (loading()) {
        <nz-spin nzSimple></nz-spin>
      } @else if (error()) {
        <nz-alert nzType="error" [nzMessage]="error()!" nzShowIcon></nz-alert>
      } @else {
        <div class="weather-grid">
          @for (forecast of forecasts(); track forecast.locationName + forecast.startTime) {
            <nz-card [nzTitle]="forecast.locationName" class="weather-card">
              <p><strong>時間:</strong> {{ forecast.startTime | date:'short' }} ~ {{ forecast.endTime | date:'short' }}</p>
              <p><strong>天氣:</strong> {{ forecast.weatherDescription }}</p>
              <p><strong>溫度:</strong> {{ forecast.temperature.min }}°C ~ {{ forecast.temperature.max }}°C</p>
              <p><strong>降雨機率:</strong> {{ forecast.rainProbability }}%</p>
            </nz-card>
          }
        </div>
      }
    </nz-card>
  `,
  styles: [`
    .weather-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }
    .weather-card {
      margin-bottom: 16px;
    }
  `]
})
export class WeatherDashboardComponent implements OnInit {
  private readonly weatherService = inject(CwbWeatherService);
  
  forecasts = signal<WeatherForecast[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadWeatherData();
  }

  loadWeatherData(): void {
    this.loading.set(true);
    this.error.set(null);

    this.weatherService.getCityWeatherForecast('臺北市').subscribe({
      next: (data) => {
        this.forecasts.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.message);
        this.loading.set(false);
      }
    });
  }
}
```

#### 3. 環境設定配置

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  cwbApiKey: 'YOUR_DEVELOPMENT_API_KEY',
  cwbApiBaseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
};

// src/environments/environment.prod.ts
export const environment = {
  production: true,
  cwbApiKey: 'YOUR_PRODUCTION_API_KEY',
  cwbApiBaseUrl: 'https://opendata.cwa.gov.tw/api/v1/rest/datastore'
};
```

更新 Service 以使用環境變數：

```typescript
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class CwbWeatherService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.cwbApiBaseUrl;
  private readonly apiKey = environment.cwbApiKey;
  
  // ... rest of the service
}
```

### Python 範例

```python
import requests
from typing import Optional, Dict, List
from datetime import datetime

class CWBWeatherAPI:
    """中央氣象署開放資料平台 API 客戶端"""
    
    BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"
    
    def __init__(self, api_key: str):
        """
        初始化 API 客戶端
        
        Args:
            api_key: CWB API 授權碼
        """
        self.api_key = api_key
        self.session = requests.Session()
    
    def get_city_weather_forecast(self, location_name: Optional[str] = None) -> Dict:
        """
        取得縣市天氣預報（36小時）
        
        Args:
            location_name: 縣市名稱（可選）
            
        Returns:
            API 回應的字典資料
        """
        dataset_id = "F-C0032-001"
        params = {"Authorization": self.api_key}
        
        if location_name:
            params["locationName"] = location_name
        
        response = self.session.get(
            f"{self.BASE_URL}/{dataset_id}",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_station_observation(self, station_name: Optional[str] = None) -> Dict:
        """
        取得自動氣象站觀測資料
        
        Args:
            station_name: 測站名稱（可選）
            
        Returns:
            API 回應的字典資料
        """
        dataset_id = "O-A0003-001"
        params = {"Authorization": self.api_key}
        
        if station_name:
            params["StationName"] = station_name
        
        response = self.session.get(
            f"{self.BASE_URL}/{dataset_id}",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def get_earthquake_report(self, limit: int = 10) -> Dict:
        """
        取得地震報告
        
        Args:
            limit: 回傳筆數限制
            
        Returns:
            API 回應的字典資料
        """
        dataset_id = "E-A0016-001"
        params = {
            "Authorization": self.api_key,
            "limit": str(limit)
        }
        
        response = self.session.get(
            f"{self.BASE_URL}/{dataset_id}",
            params=params
        )
        response.raise_for_status()
        return response.json()

# 使用範例
if __name__ == "__main__":
    api = CWBWeatherAPI("YOUR_API_KEY")
    
    # 取得台北市天氣預報
    taipei_weather = api.get_city_weather_forecast("臺北市")
    print("台北市天氣預報:", taipei_weather)
    
    # 取得地震報告
    earthquakes = api.get_earthquake_report(limit=5)
    print("最新地震報告:", earthquakes)
```

### cURL 範例

```bash
# 取得全台縣市天氣預報
curl -X GET "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=YOUR_API_KEY"

# 取得台北市天氣預報
curl -X GET "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=YOUR_API_KEY&locationName=臺北市"

# 取得自動氣象站資料
curl -X GET "https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=YOUR_API_KEY"

# 取得地震報告（限制 5 筆）
curl -X GET "https://opendata.cwa.gov.tw/api/v1/rest/datastore/E-A0016-001?Authorization=YOUR_API_KEY&limit=5"
```

---

## 錯誤處理

### 常見錯誤碼

| HTTP 狀態碼 | 錯誤訊息 | 說明 | 解決方法 |
|------------|---------|------|---------|
| 400 | Bad Request | 請求參數錯誤 | 檢查 API 參數格式與必填欄位 |
| 401 | Unauthorized | 授權失敗 | 確認 API 金鑰是否正確與有效 |
| 403 | Forbidden | 無權限存取 | 檢查 API 金鑰的資料集存取權限 |
| 404 | Not Found | 資料集不存在 | 確認資料集 ID 是否正確 |
| 429 | Too Many Requests | 超過速率限制 | 降低請求頻率或升級配額 |
| 500 | Internal Server Error | 伺服器錯誤 | 稍後重試，若持續發生請聯繫客服 |
| 503 | Service Unavailable | 服務暫時無法使用 | 稍後重試 |

### 錯誤回應格式

```json
{
  "success": "false",
  "error": {
    "code": "401",
    "message": "Invalid Authorization Code"
  }
}
```

### TypeScript 錯誤處理範例

```typescript
import { HttpErrorResponse } from '@angular/common/http';
import { catchError, retry, timeout } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

export class CwbWeatherService {
  // ...

  getCityWeatherForecastWithRetry(locationName?: string): Observable<WeatherForecast[]> {
    return this.getCityWeatherForecast(locationName).pipe(
      timeout(10000), // 10 秒逾時
      retry(3), // 失敗時重試 3 次
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '發生未知錯誤';

        if (error.error instanceof ErrorEvent) {
          // 客戶端或網路錯誤
          errorMessage = `網路錯誤: ${error.error.message}`;
        } else {
          // 後端回傳錯誤
          switch (error.status) {
            case 400:
              errorMessage = '請求參數錯誤，請檢查輸入資料';
              break;
            case 401:
              errorMessage = 'API 授權失敗，請檢查 API 金鑰';
              break;
            case 403:
              errorMessage = '無權限存取此資料集';
              break;
            case 404:
              errorMessage = '找不到指定的資料集';
              break;
            case 429:
              errorMessage = '請求過於頻繁，請稍後再試';
              break;
            case 500:
            case 503:
              errorMessage = '氣象署服務暫時無法使用，請稍後再試';
              break;
            default:
              errorMessage = `伺服器錯誤 (${error.status}): ${error.message}`;
          }
        }

        console.error('CWB API 錯誤:', errorMessage, error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
```

---

## 速率限制與配額

### 免費版限制
- **每日請求次數**: 20,000 次 / 每組授權碼
- **每分鐘請求次數**: 300 次
- **並行連線數**: 10 個

### 配額使用建議
1. **實作快取機制**: 避免重複請求相同資料
2. **使用適當的更新頻率**: 
   - 天氣預報: 每 3-6 小時更新一次
   - 觀測資料: 每 10-30 分鐘更新一次
   - 地震資料: 有需求時才請求
3. **批次處理**: 一次取得多個地點資料而非分批請求
4. **錯誤重試策略**: 使用指數退避（Exponential Backoff）

### TypeScript 快取實作範例

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, shareReplay } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class CwbWeatherServiceWithCache {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
  private readonly apiKey = 'YOUR_API_KEY';
  
  // 快取儲存
  private cache = new Map<string, CacheEntry<any>>();
  
  // 快取有效期限（毫秒）
  private readonly CACHE_DURATION = {
    forecast: 3 * 60 * 60 * 1000,    // 3 小時
    observation: 10 * 60 * 1000,     // 10 分鐘
    earthquake: 5 * 60 * 1000        // 5 分鐘
  };

  /**
   * 取得縣市天氣預報（帶快取）
   */
  getCityWeatherForecast(locationName?: string): Observable<WeatherForecast[]> {
    const cacheKey = `forecast_${locationName || 'all'}`;
    const cached = this.getFromCache<WeatherForecast[]>(cacheKey, this.CACHE_DURATION.forecast);
    
    if (cached) {
      console.log('使用快取資料:', cacheKey);
      return of(cached);
    }

    const datasetId = 'F-C0032-001';
    const params = { Authorization: this.apiKey };
    if (locationName) {
      params['locationName'] = locationName;
    }

    return this.http.get<CwbApiResponse>(`${this.baseUrl}/${datasetId}`, { params }).pipe(
      map(response => this.transformWeatherData(response)),
      tap(data => this.setCache(cacheKey, data)),
      catchError(error => {
        console.error('CWB API 錯誤:', error);
        return throwError(() => new Error('無法取得天氣預報資料'));
      }),
      shareReplay(1) // 避免同時多個訂閱觸發多次請求
    );
  }

  /**
   * 從快取中取得資料
   */
  private getFromCache<T>(key: string, maxAge: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * 將資料存入快取
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 清除所有快取
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 清除特定快取
   */
  clearCacheByKey(key: string): void {
    this.cache.delete(key);
  }
}
```

---

## 最佳實踐

### 1. 安全性
- ✅ **使用 HTTPS**: 所有 API 請求都應使用 HTTPS
- ✅ **保護 API 金鑰**: 不要在前端程式碼或版本控制系統中暴露 API 金鑰
- ✅ **使用環境變數**: 將 API 金鑰儲存在環境變數或安全的配置服務中
- ✅ **定期更換金鑰**: 定期更換 API 金鑰以提升安全性
- ✅ **後端代理**: 對於公開的網頁應用，建議透過後端 API 代理 CWB 請求

### 2. 效能優化
- 🚀 **實作快取機制**: 避免重複請求相同資料
- 🚀 **壓縮請求**: 使用 gzip 壓縮以減少傳輸量
- 🚀 **批次請求**: 一次取得多個資料點而非分批請求
- 🚀 **延遲載入**: 僅在需要時才載入資料
- 🚀 **CDN 快取**: 對於靜態的預報資料可考慮使用 CDN 快取

### 3. 錯誤處理
- ⚠️ **實作重試機制**: 使用指數退避策略處理暫時性錯誤
- ⚠️ **友善的錯誤訊息**: 向使用者顯示易懂的錯誤訊息
- ⚠️ **日誌記錄**: 記錄所有 API 錯誤以便除錯
- ⚠️ **降級處理**: 在 API 無法使用時提供備用方案
- ⚠️ **逾時處理**: 設定適當的請求逾時時間（建議 10-30 秒）

### 4. 資料處理
- 📊 **資料驗證**: 驗證 API 回傳的資料結構和內容
- 📊 **型別安全**: 使用 TypeScript 介面定義資料結構
- 📊 **資料轉換**: 將 API 資料轉換為應用程式所需格式
- 📊 **單位轉換**: 必要時進行溫度、風速等單位轉換
- 📊 **時區處理**: 正確處理時間資料的時區（CWB 使用 GMT+8）

### 5. 使用者體驗
- 💡 **載入狀態**: 顯示載入指示器
- 💡 **錯誤狀態**: 清楚顯示錯誤訊息和解決方案
- 💡 **資料更新時間**: 顯示資料最後更新時間
- 💡 **離線支援**: 考慮實作離線快取以支援無網路環境
- 💡 **響應式設計**: 確保在各種裝置上都能良好顯示

### 6. 在 GigHub 專案中的整合建議

#### 架構整合
```
src/app/
├── core/
│   ├── services/
│   │   └── cwb-weather.service.ts    # CWB API 服務
│   └── infra/
│       └── weather-repository.ts      # Repository 模式
├── routes/
│   └── dashboard/
│       └── widgets/
│           └── weather-widget/        # 天氣小工具元件
└── shared/
    └── interfaces/
        └── weather.interface.ts       # 天氣資料介面
```

#### Repository 模式實作
```typescript
// src/app/core/infra/weather-repository.ts
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CwbWeatherService } from '../services/cwb-weather.service';
import { WeatherForecast } from '@shared/interfaces/weather.interface';

/**
 * 天氣資料 Repository
 * 提供統一的資料存取介面
 */
@Injectable({
  providedIn: 'root'
})
export class WeatherRepository {
  private readonly cwbService = inject(CwbWeatherService);

  /**
   * 根據專案位置取得天氣預報
   * @param projectLocation 專案位置（縣市或鄉鎮）
   */
  getProjectWeather(projectLocation: string): Observable<WeatherForecast[]> {
    return this.cwbService.getCityWeatherForecast(projectLocation);
  }

  /**
   * 取得施工適宜度評估
   * @param forecast 天氣預報資料
   * @returns 施工適宜度分數 (0-100)
   */
  calculateConstructionSuitability(forecast: WeatherForecast): number {
    let score = 100;
    
    // 降雨機率影響
    if (forecast.rainProbability > 70) score -= 40;
    else if (forecast.rainProbability > 50) score -= 25;
    else if (forecast.rainProbability > 30) score -= 10;
    
    // 溫度影響
    if (forecast.temperature.max > 35) score -= 20;
    else if (forecast.temperature.max > 32) score -= 10;
    if (forecast.temperature.min < 10) score -= 15;
    
    return Math.max(0, score);
  }
}
```

---

## 常見問題

### Q1: API 金鑰如何取得？
**A**: 請前往 [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/) 註冊會員並申請授權碼。

### Q2: API 是否需要付費？
**A**: 基本版完全免費，每日提供 20,000 次請求配額。若需要更高配額，可洽詢氣象署。

### Q3: 資料更新頻率為何？
**A**: 
- 天氣預報：每 3-6 小時更新
- 觀測資料：每 10 分鐘更新
- 地震資料：即時發布

### Q4: 支援哪些縣市？
**A**: 支援台灣本島及離島所有 22 個縣市，以及其下所有鄉鎮市區。

### Q5: 如何取得特定鄉鎮的天氣？
**A**: 使用鄉鎮天氣預報 API (`F-D0047-XXX`)，其中 XXX 為縣市代碼。

### Q6: API 回應時間多久？
**A**: 通常在 1-3 秒內回應，視網路狀況與伺服器負載而定。

### Q7: 遇到 429 錯誤該怎麼辦？
**A**: 這表示超過速率限制。請降低請求頻率，實作快取機制，或申請更高配額。

### Q8: 資料的準確度如何？
**A**: 資料來自中央氣象署官方，具有高度可信度。預報準確度依時間長度遞減，短期預報（24-48小時）準確度最高。

### Q9: 可以商業使用嗎？
**A**: 可以。開放資料可自由使用於商業或非商業用途，但須註明資料來源。

### Q10: 如何聯繫技術支援？
**A**: 請透過氣象署開放資料平台的聯絡表單或客服信箱聯繫。

---

## 參考資源

### 官方資源
- 🌐 [中央氣象署開放資料平台](https://opendata.cwa.gov.tw/)
- 📖 [API 使用說明文件](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- 📧 客服信箱: opendata@cwa.gov.tw

### 相關工具
- [Postman Collection](https://www.postman.com/) - API 測試工具
- [RxJS Documentation](https://rxjs.dev/) - Angular 專案必備
- [Angular HttpClient](https://angular.dev/guide/http) - HTTP 請求處理

### 社群資源
- GitHub 上的開源專案範例
- 技術部落格文章
- Stack Overflow 問答

---

## 版本歷史

| 版本 | 日期 | 更新內容 |
|------|------|----------|
| 1.0.0 | 2025-12-06 | 初版發布，包含完整 API 文檔與 TypeScript/Angular 範例 |

---

## 授權聲明

本文檔基於中央氣象署開放資料平台的公開資訊編寫。所有氣象資料版權歸屬中央氣象署所有。

使用資料時請註明來源：「資料來源：中央氣象署開放資料平台」

---

**文檔維護**: GigHub 開發團隊  
**最後更新**: 2025-12-06  
**聯絡方式**: 請透過專案 GitHub Issues 回報文檔問題
