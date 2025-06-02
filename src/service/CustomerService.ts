export interface Country {
  name: string;
  code: string;
}

export interface Representative {
  name: string;
  image: string;
}

export interface Customer {
  id: number;
  name: string;
  country: Country;
  company: string;
  date: string;
  status: 'unqualified' | 'qualified' | 'new' | 'negotiation' | 'renewal';
  verified: boolean;
  activity: number;
  representative: Representative;
  balance: number;
}

export const CustomerService = {
    getData(): Customer[] {
        return [
            {
                id: 1000,
                name: 'James Butt',
                country: {
                    name: 'Algeria',
                    code: 'dz'
                },
                company: 'Benton, John B Jr',
                date: '2015-09-13',
                status: 'unqualified',
                verified: true,
                activity: 17,
                representative: {
                    name: 'Ioni Bowcher',
                    image: 'ionibowcher.png'
                },
                balance: 70663
            },
            {
                id: 1001,
                name: 'Josephine Darakjy',
                country: {
                    name: 'Egypt',
                    code: 'eg'
                },
                company: 'Chanay, Jeffrey A Esq',
                date: '2019-02-09',
                status: 'negotiation',
                verified: true,
                activity: 0,
                representative: {
                    name: 'Amy Elsner',
                    image: 'amyelsner.png'
                },
                balance: 82429
            },
            {
                id: 1002,
                name: 'Art Venere',
                country: {
                    name: 'Panama',
                    code: 'pa'
                },
                company: 'Chemel, James L Cpa',
                date: '2017-05-13',
                status: 'qualified',
                verified: false,
                activity: 63,
                representative: {
                    name: 'Asiya Javayant',
                    image: 'asiyajavayant.png'
                },
                balance: 28334
            },
            {
                id: 1003,
                name: 'Lenna Paprocki',
                country: {
                    name: 'Slovenia',
                    code: 'si'
                },
                company: 'Feltz Printing Service',
                date: '2020-09-15',
                status: 'new',
                verified: false,
                activity: 37,
                representative: {
                    name: 'Xuxue Feng',
                    image: 'xuxuefeng.png'
                },
                balance: 88521
            },
            {
                id: 1004,
                name: 'Donette Foller',
                country: {
                    name: 'South Africa',
                    code: 'za'
                },
                company: 'Printing Dimensions',
                date: '2016-05-20',
                status: 'negotiation',
                verified: true,
                activity: 33,
                representative: {
                    name: 'Asiya Javayant',
                    image: 'asiyajavayant.png'
                },
                balance: 93905
            },
            {
                id: 1005,
                name: 'Simona Morasca',
                country: {
                    name: 'Egypt',
                    code: 'eg'
                },
                company: 'Chapman, Ross E Esq',
                date: '2018-02-16',
                status: 'qualified',
                verified: false,
                activity: 68,
                representative: {
                    name: 'Ivan Magalhaes',
                    image: 'ivanmagalhaes.png'
                },
                balance: 50041
            },
            {
                id: 1006,
                name: 'Mitsue Tollner',
                country: {
                    name: 'Paraguay',
                    code: 'py'
                },
                company: 'Morlong Associates',
                date: '2018-02-19',
                status: 'renewal',
                verified: true,
                activity: 54,
                representative: {
                    name: 'Ivan Magalhaes',
                    image: 'ivanmagalhaes.png'
                },
                balance: 58706
            },
            {
                id: 1007,
                name: 'Leota Dilliard',
                country: {
                    name: 'Serbia',
                    code: 'rs'
                },
                company: 'Commercial Press',
                date: '2019-08-13',
                status: 'renewal',
                verified: true,
                activity: 69,
                representative: {
                    name: 'Onyama Limba',
                    image: 'onyamalimba.png'
                },
                balance: 26640
            },
            {
                id: 1008,
                name: 'Sage Wieser',
                country: {
                    name: 'Egypt',
                    code: 'eg'
                },
                company: 'Truhlar And Truhlar Attys',
                date: '2018-11-21',
                status: 'unqualified',
                verified: true,
                activity: 76,
                representative: {
                    name: 'Ivan Magalhaes',
                    image: 'ivanmagalhaes.png'
                },
                balance: 65369
            },
            {
                id: 1009,
                name: 'Kris Marrier',
                country: {
                    name: 'Mexico',
                    code: 'mx'
                },
                company: 'King, Christopher A Esq',
                date: '2015-07-07',
                status: 'negotiation',
                verified: false,
                activity: 3,
                representative: {
                    name: 'Onyama Limba',
                    image: 'onyamalimba.png'
                },
                balance: 63451
            },
            {
                id: 1010,
                name: 'Minna Amigon',
                country: {
                    name: 'Romania',
                    code: 'ro'
                },
                company: 'Dorl, James J Esq',
                date: '2018-11-07',
                status: 'qualified',
                verified: false,
                activity: 38,
                representative: {
                    name: 'Anna Fali',
                    image: 'annafali.png'
                },
                balance: 71169
            }
            // Note: This is a simplified version with just the first 10 customers
            // The full implementation would include all 1000+ customers
        ];
    },

    getCustomersMini(): Promise<Customer[]> {
        return Promise.resolve(this.getData().slice(0, 5));
    },

    getCustomersSmall(): Promise<Customer[]> {
        return Promise.resolve(this.getData().slice(0, 10));
    },

    getCustomersMedium(): Promise<Customer[]> {
        return Promise.resolve(this.getData().slice(0, 50));
    },

    getCustomersLarge(): Promise<Customer[]> {
        return Promise.resolve(this.getData().slice(0, 200));
    },

    getCustomersXLarge(): Promise<Customer[]> {
        return Promise.resolve(this.getData());
    },

    getCustomers(params?: { first?: number; rows?: number }): Promise<{ data: Customer[]; totalRecords: number }> {
        const data = this.getData();
        
        if (params) {
            const first = params.first || 0;
            const rows = params.rows || 10;
            const slicedData = data.slice(first, first + rows);
            
            return Promise.resolve({
                data: slicedData,
                totalRecords: data.length
            });
        }
        
        return Promise.resolve({
            data: data,
            totalRecords: data.length
        });
    }
};
