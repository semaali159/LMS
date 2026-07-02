
export interface offsetPaginationInput{
    page?:number;
    limit?:number;
}
export interface offsetPaginationOutput<T>{
    data:T[];
    meta:{
        page:number;
        limit:number;
        totalPages:number;
        totalItems:number;
        hasPrevious:boolean;
        hasNext:boolean
    }

}

const MAX_LIMIT = 100
const DEFAULT_LIMIT = 20

export function normalizeOffset(input:offsetPaginationInput):{
    page:number;
    limit:number;
    skip:number;
    take:number;}{
        const page = Math.max(1, input.page ?? 1)
        const limit = Math.min(MAX_LIMIT,Math.max(1, input.limit ?? DEFAULT_LIMIT))
        return{ page:page,
                limit:limit,
                skip:(page - 1) * limit,
                take:limit
            }
            
}

export function buildOffset<T>(
    data:T[],
    totalItems:number,
    page:number,
    limit:number
):offsetPaginationOutput<T>{
    const totalPages = Math.max(1,Math.ceil(totalItems / limit))
    return{
        data,
        meta:{
            page,
            limit,
            totalItems,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page >1
        }
    }

}