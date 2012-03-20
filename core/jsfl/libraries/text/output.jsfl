// ------------------------------------------------------------------------------------------------------------------------
//
//  ██████        ██                ██
//  ██  ██        ██                ██
//  ██  ██ ██ ██ █████ █████ ██ ██ █████
//  ██  ██ ██ ██  ██   ██ ██ ██ ██  ██
//  ██  ██ ██ ██  ██   ██ ██ ██ ██  ██
//  ██  ██ ██ ██  ██   ██ ██ ██ ██  ██
//  ██████ █████  ████ █████ █████  ████
//                     ██
//                     ██
//
// ------------------------------------------------------------------------------------------------------------------------
// Output - provides logging functionality, object introspection, and a variety of printing and formatting methods


	/**
	 * Provides logging functionality, object introspection, and a variety of printing and formatting methods
	 */
	Output =
	{

		/**
		 * Formats a string and subsequent arguments to the Output panel
		 * @param	{String}	value	A String value with named {placeholder} variables
		 * @param	{Object}	params	A parameters Object, Array, 
		 * @returns	{String}			The populated string
		 */
		format:function(value, params)
		{
			var str = Utils.populate.apply(this, arguments);
			fl.outputPanel.trace(str);
			return str;
		},
		
		/**
		 * Converts a typical [object Object] string into an [object Class value="1" property="2"] string
		 * Should only be used on JavaScript Objects that already convert properly to String
		 * @param	{Object}	obj			Any object that can be converted to a String
		 * @param	{Boolean}	output		An optional Boolean idicating to output the result to the Output panel
		 * @returns	{String}				A String representation of the object and its properties
		 */
		props:function(obj, output)
		{
			// variables
				var props	= '';
				var str		= String(obj);

			// propertes
				for(var i in obj)
				{
					var value = obj[i];
					if(typeof value === 'function')
					{
						continue;
					}
					if(typeof value === 'string')
					{
						value = '"' +value+ '"';
					}
					props += ' ' + i + '=' + value;
				}

			// str
				str = str.replace(']', props + ']')

			// output
				if(output)
				{
					fl.trace(str);
				}

			// return
				return str;
		},

		/**
		 * Lists the properties of an object in a human-readable format
		 * @param	{Object}	arr			An object whose properties you wish to list
		 * @param	{Array}		arr			An Array of objects with selected properties you wish to list
		 * @param	{String}	properties	An optional property to list, defaults to 'name'
		 * @param	{Array}		properties	An optional Array of properties
		 * @param	{String}	label		An optional String label, defaults to "List"
		 * @param	{Boolean}	output		An optional boolean to indicate output type: true=debug, false=return, undefined=output
		 * @returns	{String}				A String list of the object's properties
		 */
		list:function(arr, properties, label, output)
		{
			// catch null values
				if( ! arr)
				{
					throw new ReferenceError('ReferenceError: Output.list(): parameter "arr" is undefined');
				}

			// defaults
				label			= label || 'List';

			// variables
				var props		= properties || 'name';
				var strOutput	= '';

			// if arr is an array, grab selected properties
				if(arr instanceof Array)
				{
					// collect object to string only
						if(properties == null)
						{
							arr			= arr.map( function(element){ return String(element); } );
						}
					// collect children's properties
						else
						{
							arr			= Utils.getValues(arr, props);
						}

					// trace
						strOutput = Output.inspect(arr, label, props instanceof Array ? 2 : 1, output);
				}

			// if arr is an object, just output the top-level key/values
				else
				{
					 strOutput = Output.inspect(arr, label, 1, output, {'function':false});
				}

			// output
				return strOutput;
		},

		/**
		 * Output object to Output panel in hierarchical format (note that $ arguments are optional, and can be passed in any order)
		 * @param	{Object}	obj					Any Object or value
		 * @param	{Number}	$depth				An optional max depth to recurse to (defaults to 3)
		 * @param	{String}	$label				An optional String label (defaults to "Inspect")
		 * @param	{Boolean}	$functions			An optional boolean to process functions. Defaults to false
		 * @param	{Object}	$options			An optional options object. Keys may be:
														ignore: A String or Array of object types to ignore. Valid values are 'object', 'string', 'array', 'number', 'xml', 'object', 'boolean', 'function', 'undefined', 'null'.
														print:	A Boolean to instruct the outputter to print or not print the values to the Output panel. Defaults to true.
														debug:	A Boolean indicating to trace the output as it happens. Defaults to false.
														private: A Boolean indicating to process or skip private (_underscored) properties. Defaults to false.
		 * @param	{Function}	$callback			An optional output function in case you want to do any custom processing of the data
		 * @returns	{String}						A String hierarchy of the object's properties
		 */
		inspect:function(obj, $depth, $label, $functions, $options, $callback)
		{
			//TODO For callback / debug, output to file in two separate passes - 1:key, 2:value, that way you get to see the actual key name who's value breaks the iteration

			// ---------------------------------------------------------------------------------------------------------------------
			// methods

				// -------------------------------------------------------------------------------------------------------
				// traversal functions

					function processValue(obj)
					{
						// get type
							var type = getType(obj);

						// compound
							if (type === 'object')
							{
								processObject(obj);
							}
							else if (type === 'array')
							{
								processArray(obj);
							}

						// simple
							else
							{
								output(getValue(obj));
							}
					}

					function processLeaf(value, key)
					{
						// quit if max depth reached
							if (indent.length > depth)
							{
								return false;
							}

						// skip prototypes (seems to cause silent errors. Not sure if this is an issue with prototypes, or just some classes)
							// trace(key);
							if(key === 'prototype')
							{
								//return false;
							}

						// variables
							key = key !== undefined ? key :  null;

						// get type
							var type		= getType(value[key]);

						// skip object if type is set to be ignored
							//trace(value + ':' + type)
							if(options.ignore[type])
							{
								return false;
							}

						// if compound, recurse
							if (type === 'object' || type === 'array')
							{
								// TODO Check if we need the compound recursion check, and if a stack.indexOf(value[key]) would suffice
								if(checkRecursion())
								{
									stats.objects++;
									var className = getType(value[key], true);
									output("[" + key + "] => " +className);
									type == 'object' ? processObject(value[key]) : processArray(value[key]);
								}
								else
								{
									output(' ' + key + ": [ RECURSION! ]");
								}
							}

						// if simple, output
							else
							{
								stats.values++;
								output(' ' + key + ": " + getValue(value[key]));
							}

						// return
							return true;
					}

					function processObject(obj)
					{
						//TODO have two loops - one for illegal instances, one for legal instances.
						//TODO use PropertyResolver class

						down(obj);
						for (var key in obj)
						{
							//fl.trace('~' + key)
							if( ! key.match(rxIllegal))// && obj.hasOwnProperty(i)
							{
								processLeaf(obj, key);
							}
							else
							{
								if(key !== 'constructor')
								{
									output(' ' + key + ": [ SKIPPING! ]");
								}
							}
						}
						up();
					}

					function processArray(arr)
					{
						down(arr);
						for (var i = 0; i < arr.length; i++)
						{
							processLeaf(arr, i);
						}
						up();
					}


				// -------------------------------------------------------------------------------------------------------
				// output functions

					function output(str)
					{
						// update str
							str = String(str).replace(/\n/gm, '\n	' + indent);
							
						// get output
							var output = indent.join('') + str
							strOutput += output + '\n';

						// if callback, call it
							if(callback)
							{
								callback(output);
							}

						// if debugging, output immediately
							if(options.debug)
							{
								trace('	' + output);
							}
					}

					function down(obj)
					{
						stack.push(obj);
						indent.push('\t');
						//fl.trace('\n>>>>>' + stack.length + '\n')
					}

					function up()
					{
						stack.pop();
						indent.pop();
						//fl.trace('\n>>>>>' + stack.length + '\n')
					}


				// -------------------------------------------------------------------------------------------------------
				// utility functions

					function checkRecursion()
					{
						for (var i = 0; i < stack.length - 1; i++)
						{
							for (var j = i + 1; j < stack.length; j++)
							{
								if(stack[i] === stack[j])
								{
									return false;
								}
							}
						}
						return true;
					}

				// -------------------------------------------------------------------------------------------------------
				// inspector functions

					/**
					 * Get the type of an object
					 * @param	{Object}		value			Any value or object
					 * @param	{Boolean}		getClassName	return the class name rather than the type if possible
					 * @returns	The type of classname of a value
					 */
					function getType(value, getClassName)
					{
						var type		= typeof value;
						var className	= type.substr(0,1).toUpperCase() + type.substr(1);

						//fl.trace('type:' + type)
						//fl.trace('value:' + value)

						switch(type)
						{

							case 'object':
								if(value == null)
								{
									type		= 'null';
									className	= '';
								}
								/*
								else if (value.toString() == '[object Parameter]')
								{
									type = 'Parameter';
								}
								else if (/^(\[object Parameter\],?){1,}$/im.test(value))
								{
									type = 'Object';
								}
								*/
								else if (value instanceof Array && value.constructor == Array)
								{
									type		= 'array';
									className	= 'Array';
								}
								else if (value instanceof Date)
								{
									type		= 'date';
									className	= 'Date';
								}
								else if (value instanceof RegExp)
								{
									type		= 'regexp';
									className	= 'RegExp';
								}
								/*
								else if(value.constructor)
								{
									fl.trace(value.toSource())
									type		= 'class';
									className	= String(value.constructor).match(/function (\w+)/)[1];
								}
								*/
								else
								{
									var matches = String(value).match(/^\[(object|class) ([_\w]+)/);
									//type		= matches[1];
									className	= matches ? matches[2] : 'Unknown';
								}
							break;

							case 'undefined':
								className = '';
							break;

							case 'xml':
								// If an XMLList has only one element, you can treat is as XML
								// @see http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/XMLList.html
								className = value.length() > 1 ? 'XMLList' : 'XML';
							break;

							case 'function': // loop through properties to see if it's a class
								if (value instanceof RegExp)
								{
									type		= 'regexp';
									className	= 'RegExp';
								}
								else
								{
									for(var i in value)
									{
										if(i !== 'prototype')
										{
											type = 'object';
											className = 'Class';
											break;
										}
									}
								}
							break;

							case 'string':
							case 'boolean':
							case 'number':
							default:
							//fl.trace('--' + value)
						}
						return getClassName ? className : type;
					}

					function getValue(obj)
					{
						var value;
						var type	 = getType(obj);

						switch(type)
						{
							case 'array':
							case 'object':
								value = obj;
							break;

							case 'string':
								value = '"' + obj.replace(/"/g, '\"') + '"';
							break;

							case 'xml':
								var ind = indent.join('\t').replace('\t', '')
								value = obj.toXMLString();
								value = value.replace(/ {2}/g, '\t').replace(/^/gm, ind).replace(/^\s*/, '');
							break;
							/*
							*/
							case 'function':
								obj = obj.toString();
								value = obj.substr(0, obj.indexOf('{'));
							break;

							case 'regexp':
							case 'boolean':
							case 'undefined':
							case 'number':
							case 'null':
							case 'undefined':
							default:
								value = String(obj);
						}
						return value;
					}


			// ---------------------------------------------------------------------------------------------------------------------
			// setup

				// defaults
					var label		= 'Inspect';
					var depth		= 4;
					var functions	= false;
					var print		= true;
					var callback	= null;
					var options		= {};

				// parameter shifting
					for each(var arg in [$depth, $label, $functions, $options, $callback])
					{
						if(typeof arg === 'number')
							depth = arg;
						else if(typeof arg === 'string')
							label = arg;
						else if(typeof arg === 'boolean')
							functions = arg;
						else if(typeof arg === 'object')
							options = arg;
						else if(typeof arg === 'function')
							callback = arg;
					}
					
				// options
					options.ignore = options.ignore ? Utils.makeHash(options.ignore, true) : {};
					if( ! functions )
					{
						options.ignore['function'] = true;
					}
					
				// recursion detection
					var stack			= [];

				// uncallable properties
					var illegal			= [
											'constructor', // class
											'tools|toolObjs|activeTool', // window
											'morphShape|hintsList|actionScriptOffsets', // shape
											'brightness|tintColor|tintPercent', // SymbolInstance
											]

				// init
					var rxIllegal		= new RegExp('^' + illegal.join('|') + '$');
					var indent			= [];
					var strOutput		= '';
					var type			= getType(obj);
					var className		= getType(obj, true);

				// reset stats
					var stats			= {objects:0, values:0, time:new Date};

			// ---------------------------------------------------------------------------------------------------------------------
			// output

				// if debug, start tracing now, as subsequent output will be traced directly to the listener
					if(options.debug)
					{
						if(label == 'Inspect')
						{
							label = 'Debug';
						}
						trace(Output._print('', label + ': ' + className, false).replace(/\s*$/, ''))
					}

				// initial outout
					if(type == 'object' || type == 'array')
					{
						output( type + ' => ' + className);
					}

				// process
					processValue(obj);

				// get final stats
					stats.time			= (((new Date) - stats.time) / 1000).toFixed(1) + ' seconds';
					stats				= ' (depth:' +depth+ ', objects:' +stats.objects+ ', values:' +stats.values+ ', time:' +stats.time+')';

				// output
					if(options.debug)
					{
						trace('\n' + stats + '\n');
					}
					else if(options.print !== false)
					{
						Output._print(strOutput, label + ': ' + className + stats);
					}

				// return
					return strOutput;

		},

		/**
		 * Convenience function to Table.print() to output value in tabular format
		 * @param	{array}		arr			An Array of values
		 * @returns	{String}				The output of the print() call
		 */
		table:function(arr)
		{
			return Table.print(arr);
		},

		/**
		 * View the hierarchy of a folder
		 * @param	{String}		pathOrURI	A valid folder path
		 * @param	{Folder}		pathOrURI	An existing folder object
		 * @param	{Number}		depth		An optional max depth to recurse to (defaults to 3)
		 * @param	{Boolean}		output		An optional boolean to indicate outputting or not (defaults to true)
		 * @returns	{String}					The String hierarchy of the folder
		 */
		folder:function(pathOrURI, depth, output)
		{
			// output
				var _output = '';

			// callback
				function callback(element, index, level, indent)
				{
					_output += indent + '/' +  element.name + '\n';
				}

			// process
				var files = Utils.walkFolder(pathOrURI, callback, depth);

			// print
				if(output !== false)
				{
					trace(_output);
				}

			// return
				return _output;
		},

		/**
		 * Print the content to the listener as a formatted list. Normally this is only called by the other Output functions!
		 * @param	{Object}	content		The content to be output
		 * @param	{String}	title		The title of the print
		 * @param	{Boolean}	output		An optional Boolean specifying whether to print to the Output Panel, defualts to true
		 * @return	{String}				The String result of the print
		 */
		_print:function(content, title, output)
		{
			// variables
				output		= output !== false;
				var result	= '';
				var border	= new Array(Math.max(title.length, 80) + 1).join('-');
				result		+= '\n' +title + '\n' +border+ '\n';
				result		+= '' + String(content);
				//result		= result.replace(/\n/g, '\n\t');

			// trace
				if (output)
				{
					fl.trace(result);
				}

			// return
				return result;
		},

		toString:function()
		{
			return '[class Output]';
		}

	}


	// ---------------------------------------------------------------------------------------------------------------------
	// register class with xjsfl

		xjsfl.classes.register('Output', Output);
		xjsfl.classes.register('inspect', Output.inspect);
		xjsfl.classes.register('list', Output.list);

		inspect = Output.inspect;
		list	= Output.list;
