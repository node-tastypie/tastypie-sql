'use strict';
const pg = require('pg')
const sql = require('sql');
const sqlquery = require('sql-query')
const Query = require('sql-query').Query
const query = new Query({dialect:'postgresql'});

sql.setDialect('postgres');

function contains( name, value ){
	return `${name} LIKE %${value}%`
}
function all (name, value ){
	const values = Array.isArray( value ) ? value : value.split(',')
	const bits = values.map((bit)=>{
		return `${name} = ${bit}`
	});

	return `( ${bits.join(' AND ')} )`
}

function startswith( name, value ){
	return `${name} LIKE ${value}`
}


const conn = new pg.Client({
   user: 'postgres',
   password: 'abc123',
   database: 'tastypie'
})

conn.connect((err)=>{
	if(err) throw err
})

const user = sql.define({
	name:'tastypie_user',
	columns:[
		{name:'tastypie_user_id', dataType:'uuid', primaryKey:true, notNull: true, unique: true},
		{name:'name',dataType:'varchar(125)'},
		{name:'created_at', dataType:'timestamp without time zone'},
		{name:'email',dataType:'varchar(225)'},
		{name:'age', dataType:'int'}
	]
})


console.time('array.join')
for(let idx = 0; idx < 10000; idx++){
	[
	
	'SELECT * FROM tastypie_user WHERE '
  ,"'foo' LIKE 'ab%'"
  ,"AND"
  ,"'foo' LIKE '%f%'"
  ,"AND"
  ,"'test' = 'a'"
  ,"'test' = 'b'"
  ,"'test' = 'c'"
  ].join(' ')
}
console.timeEnd('array.join')

console.time('filter functions')
for(let idx = 0; idx < 10000; idx++){
	'SELECT * FROM tastypie_user WHERE '
	+ [ startswith('foo','ab'), contains('foo', 'f'), all('test', 'a,b,c') ].join(' AND ')
}
console.timeEnd('filter functions')

console.time('SQL.toQuery')
for(let idx = 0; idx < 10000; idx++){
	user.select(user.star()).where(
		user.name.like('ab%')
	).and(
		user.name.like('%f%')
	).and(
		user.age.in([1,2,3])
	).toQuery()
}
console.timeEnd('SQL.toQuery')

console.time('sql-query')
for(let idx = 0; idx < 10000; idx++){
	query.select().from('tastypie_user').where({foo:sqlquery.like('ab%')}, {foo:sqlquery.like('%f%')}, {test:['a','b','c']}).build()
}
console.timeEnd('sql-query')
console.log(
	'node-sql',

	user.select(user.star()).where(
		user.name.like('ab%')
	).and(
		user.name.like('%f%')
	).and(
		user.age.in([1,2,3])
	).toQuery()
)
console.log(
	'filters',
	'SELECT * FROM tastypie_user WHERE '
	 + [ startswith('foo','ab'), contains('foo', 'f'), all('test', 'a,b,c') ].join(' AND ')
)

console.log(
	'sql-query',
	query.select().from('tastypie_user').where({foo:sqlquery.like('ab%')}, {foo:sqlquery.like('%f%')}, {test:['a','b','c']}).build()
)
process.exit(0)
