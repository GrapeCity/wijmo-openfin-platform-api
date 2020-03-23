import { Company } from 'stock-core';

export abstract class DataService {  

  abstract updateCompany(company: Company): Promise<Company>;

  abstract searchCompany(query: string): Promise<any[]>;
}
