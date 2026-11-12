import { Injectable } from '@angular/core';

interface CurrencyModel {
    id: number;
    name: string;
    iso_code: string;
    html_code: string;
    symbol?: string;
}

export enum CurrencyType {
  Euro = 1,
  USD = 2,
  RON = 3,
  GBP = 4
}

@Injectable({
    providedIn: 'root'
})

export class CurrencyService {
    private currencies: CurrencyModel[] = [
        {
            id: 1,
            name: 'Euro',
            iso_code: 'EUR',
            html_code: 'Euro sign',
            symbol: '€',

        },
        {
            id: 2,
            name: 'US Dollar',
            iso_code: 'USD',
            html_code: '$',
            symbol: '$'
        },
        {
            id: 3,
            name: 'RON',
            iso_code: 'RON',
            html_code: 'lei',
            symbol: 'lei'
        },
        {
            id: 1,
            name: 'British Pound',
            iso_code: 'GBP',
            html_code: '&pound;',
            symbol: '£'
        },
    ];

    getCurrencyList(): CurrencyModel[] {
        return this.currencies;
    }
}
