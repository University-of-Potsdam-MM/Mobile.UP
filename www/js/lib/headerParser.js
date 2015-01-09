define([], function(){
	
	function parse(content) {
		var result = {};
		var index = 0;
		while (index < content.length) {
			if (content.charAt(index) == ' ' || content.charAt(index) == ';') {
				index++;
				continue;
			}
			
			var attr = parseAttribute(content, index);
			index = attr.index;
			result[attr.name] = true;
			if (index < content.length && content.charAt(index) != ';') {
				var val = parseValue(content, index + 1);
				index = val.index;
				result[attr.name] = val.value;
			}
		}
		return result;
	}

	function parseAttribute(content, index) {
		var attr = "";
		while (index < content.length && content.charAt(index) != ';' && content.charAt(index) != '=') {
			attr += content.charAt(index);
			index++;
		}
		return {name: attr, index: index};
	}

	function parseValue(content, index) {
		var value = "";
		
		var quoteMode = false;
		if (content.charAt(index) == '"' || content.charAt(index) == '\'') {
			quoteMode = content.charAt(index);
			index++;
		}
		
		while (index < content.length && content.charAt(index) != ';') {
			if (content.charAt(index) == quoteMode) {
				index++;
				continue;
			}
			
			if (content.charAt(index) == '\\') {
				value += content.charAt(index + 1);
				index += 2;
				continue
			}
			
			value += content.charAt(index);
			index++;
		}
		
		return {value: value, index: index};
	}
	
	return parse;
});