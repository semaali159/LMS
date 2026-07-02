export interface cursorPaginationInput{
    cursor?:string;
    limit?:number

}

export interface cursorPaginationOutput<T>{
    data:T[];
    meta:{
        limit:number;
        nextCursor:string | null;
        hasNext:boolean
    }   
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function normalizeCursor(input:cursorPaginationInput):{
    limit:number;
    take:number
}{
    const limit = Math.min(MAX_LIMIT, Math.max(1, input.limit ?? DEFAULT_LIMIT))
    return{
        limit,
        take: limit +1
    }

}

export function buildCursor<T extends {id:string | number}>(
        rows:T[],
        limit:number
    ):cursorPaginationOutput<T>{
    const hasNext = rows.length > limit
    const data = hasNext ? rows.slice(0,limit): rows
    const nextCursor = hasNext ? String(data[data.length - 1].id) : null
    return{
        data,
        meta:{
            limit,nextCursor,hasNext
        }
    }

}