begin transaction;
delete from internal.bc_property_pinnum_formatted_owner_names;
INSERT INTO internal.bc_property_pinnum_formatted_owner_names
( pinnum, formatted_owner_name )
SELECT left(property_owner_accounts.pinnum,200),
left(array_to_string(array_agg(property_owner_accounts.owner_name ORDER BY property_owner_accounts.accountnum ASC), ' & '::text),200) AS formatted_owner_name
FROM (
    SELECT unnestedaccounts.pinnum, unnestedaccounts.accountnum,
           array_to_string(array_remove(ARRAY[
           btrim(internal.bc_property_account_master.am_last_name::text, ' '::text), 
           btrim(internal.bc_property_account_master.am_name_suffix::text, ' '::text), 
           btrim(internal.bc_property_account_master.am_first_name::text, ' '::text), 
           btrim(internal.bc_property_account_master.am_middle_name::text, ' '::text)], ''::text), ' '::text) AS owner_name
          FROM internal.bc_property_account_master, 
          (SELECT internal.bc_property.pinnum,
          unnest(regexp_split_to_array(internal.bc_property.accountnumber::text, ';'::text)) AS accountnum
          FROM internal.bc_property ) as unnestedaccounts
         WHERE unnestedaccounts.accountnum = internal.bc_property_account_master.am_account_no::text order by accountnum ASC) AS property_owner_accounts
         GROUP BY property_owner_accounts.pinnum; 
commit transaction;
